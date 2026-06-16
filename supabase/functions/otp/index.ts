import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateCode(): string {
  // Cryptographically random 6-digit code
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, email: string): Promise<boolean> {
  const windowStart = new Date(
    Math.floor(Date.now() / (RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)) *
      RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  // Upsert: increment counter for this email+window
  const { data, error } = await supabase.rpc("increment_otp_attempts", {
    p_email: email,
    p_window_start: windowStart,
  });

  if (error) {
    console.error("Rate limit check error:", error);
    // Fail open on DB errors — don't block legitimate users due to infra issues
    return true;
  }

  return (data as number) <= RATE_LIMIT_MAX_ATTEMPTS;
}

async function sendEmail(to: string, code: string, purpose: string): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const smtpUser = Deno.env.get("SMTP_USER") ?? "noreply@aicentre.app";
  const smtp2goKey = Deno.env.get("SMTP2GO_API_KEY");

  const subject = purpose === "signup"
    ? "AI Centre — Verify your account"
    : "AI Centre — Sign in code";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#0ea5e9,#10b981);padding:32px;text-align:center">
        <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#fff;margin-bottom:12px">AI</div>
        <h1 style="margin:0;font-size:22px;font-weight:700">AI Centre</h1>
        <p style="margin:6px 0 0;opacity:.85;font-size:13px">Vidyashilp Academy</p>
      </div>
      <div style="padding:32px;text-align:center">
        <p style="color:#9ca3af;margin:0 0 8px">Your verification code</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#0ea5e9;padding:20px;background:rgba(14,165,233,0.1);border-radius:12px;border:1px solid rgba(14,165,233,0.2);margin:16px 0">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:13px;margin:0">
          This code expires in <strong style="color:#fff">${OTP_EXPIRY_MINUTES} minutes</strong>.<br/>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `AI Centre <${smtpUser}>`, to: [to], subject, html }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    return;
  }

  if (smtp2goKey) {
    const res = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: smtp2goKey, to: [to], sender: smtpUser, subject, html_body: html }),
    });
    if (!res.ok) throw new Error(`smtp2go error ${res.status}: ${await res.text()}`);
    return;
  }

  // No email provider configured — throw so the caller can surface the issue
  throw new Error("No email provider configured. Set RESEND_API_KEY or SMTP2GO_API_KEY.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (action === "send") {
      const body = await req.json();
      const email = String(body.email ?? "").toLowerCase().trim();
      const purpose = String(body.purpose ?? "");

      if (!email || !purpose) return err("email and purpose are required");
      if (!["signin", "signup"].includes(purpose)) return err("invalid purpose");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("invalid email address");

      // Rate limit check
      const allowed = await checkRateLimit(supabase, email);
      if (!allowed) {
        return err(`Too many requests. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes before trying again.`, 429);
      }

      // For signin: verify the account exists using a direct DB query (not listUsers)
      if (purpose === "signin") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (!profile) {
          // Return same message regardless to prevent user enumeration
          return ok({ success: true, message: "If an account exists, a code has been sent." });
        }
      }

      // For signup: verify the email is NOT already registered
      if (purpose === "signup") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (profile) {
          return err("An account with that email already exists. Please sign in.");
        }
      }

      // Invalidate any existing unused OTPs for this email+purpose
      await supabase
        .from("email_otps")
        .update({ used: true })
        .eq("email", email)
        .eq("purpose", purpose)
        .eq("used", false);

      const code = generateCode();
      const { error: insertErr } = await supabase.from("email_otps").insert({
        email,
        code,
        purpose,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      });

      if (insertErr) {
        console.error("OTP insert error:", insertErr.message);
        return err("Failed to create verification code.", 500);
      }

      try {
        await sendEmail(email, code, purpose);
      } catch (emailErr) {
        // Roll back the OTP so the user can retry after fixing config
        await supabase.from("email_otps").update({ used: true }).eq("email", email).eq("code", code);
        console.error("Email delivery error:", (emailErr as Error).message);
        return err("Failed to send email. Please try again later.", 500);
      }

      return ok({ success: true, message: "Verification code sent to your email." });
    }

    if (action === "verify") {
      const body = await req.json();
      const email = String(body.email ?? "").toLowerCase().trim();
      const code = String(body.code ?? "").trim();
      const purpose = String(body.purpose ?? "");

      if (!email || !code || !purpose) return err("email, code, and purpose are required");
      if (code.length !== 6 || !/^\d{6}$/.test(code)) return err("invalid code format");

      const { data: otpRow, error: fetchErr } = await supabase
        .from("email_otps")
        .select("id")
        .eq("email", email)
        .eq("code", code)
        .eq("purpose", purpose)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        console.error("OTP verify error:", fetchErr.message);
        return err("Verification failed. Please try again.", 500);
      }

      if (!otpRow) {
        return err("Invalid or expired code. Please request a new one.");
      }

      await supabase.from("email_otps").update({ used: true }).eq("id", otpRow.id);

      return ok({ success: true, verified: true });
    }

    return err("Not found", 404);
  } catch (e) {
    console.error("Unhandled error:", (e as Error).message);
    return err("Internal server error", 500);
  }
});
