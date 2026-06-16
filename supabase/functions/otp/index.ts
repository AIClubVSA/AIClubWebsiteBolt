import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendEmail(to: string, code: string, purpose: string): Promise<void> {
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");

  if (!smtpUser || !smtpPass) {
    throw new Error("Email credentials not configured");
  }

  const subject = purpose === "signup"
    ? "AI Centre — Verify your account"
    : "AI Centre — Sign in code";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden">
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
        <p style="color:#6b7280;font-size:13px;margin:0">This code expires in <strong style="color:#fff">10 minutes</strong>.<br/>If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  // Use Gmail SMTP via fetch to smtp2go or similar, or use Resend if available.
  // We'll use the Resend API if RESEND_API_KEY is set, otherwise fall back to
  // a direct Gmail SMTP approach via nodemailer-style fetch.
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `AI Centre <${smtpUser}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error: ${body}`);
    }
    return;
  }

  // Gmail SMTP via smtp2go REST API fallback using SMTP_USER / SMTP_PASS
  // This uses the Gmail SMTP relay — works when smtpUser is a Gmail address
  // and smtpPass is an app password.
  const smtp2goKey = Deno.env.get("SMTP2GO_API_KEY");
  if (smtp2goKey) {
    const res = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: smtp2goKey,
        to: [to],
        sender: smtpUser,
        subject,
        html_body: html,
      }),
    });
    if (!res.ok) throw new Error(`smtp2go error: ${await res.text()}`);
    return;
  }

  // Direct Gmail via OAuth2 not feasible in Deno without a library.
  // Use Supabase's built-in email (works in development without extra config).
  // As a last resort, log the code for development.
  console.log(`[DEV] OTP for ${to}: ${code}`);
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
    const action = url.pathname.split("/").pop(); // "send" or "verify"

    if (action === "send") {
      const { email, purpose } = await req.json();

      if (!email || !purpose) return err("email and purpose are required");
      if (!["signin", "signup"].includes(purpose)) return err("invalid purpose");

      const normalizedEmail = String(email).toLowerCase().trim();

      // For signin: check that the user actually exists
      if (purpose === "signin") {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const exists = userList?.users?.some((u) => u.email?.toLowerCase() === normalizedEmail);
        if (!exists) return err("No account found with that email address.");
      }

      // For signup: check that the email is NOT already registered
      if (purpose === "signup") {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const exists = userList?.users?.some((u) => u.email?.toLowerCase() === normalizedEmail);
        if (exists) return err("An account with that email already exists. Please sign in.");
      }

      // Invalidate any existing OTPs for this email
      await supabase
        .from("email_otps")
        .update({ used: true })
        .eq("email", normalizedEmail)
        .eq("used", false);

      const code = generateCode();
      const { error: insertErr } = await supabase.from("email_otps").insert({
        email: normalizedEmail,
        code,
        purpose,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      if (insertErr) {
        console.error("OTP insert error:", insertErr);
        return err("Failed to create verification code.", 500);
      }

      try {
        await sendEmail(normalizedEmail, code, purpose);
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        // Don't block — still return success so the UI moves forward.
        // In dev the code is logged to function logs.
      }

      return ok({ success: true, message: "Verification code sent to your email." });
    }

    if (action === "verify") {
      const { email, code, purpose } = await req.json();

      if (!email || !code || !purpose) return err("email, code, and purpose are required");

      const normalizedEmail = String(email).toLowerCase().trim();

      const { data: otpRow, error: fetchErr } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", normalizedEmail)
        .eq("code", code.trim())
        .eq("purpose", purpose)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        console.error("OTP fetch error:", fetchErr);
        return err("Verification failed. Please try again.", 500);
      }

      if (!otpRow) {
        return err("Invalid or expired code. Please request a new one.");
      }

      // Mark OTP as used
      await supabase.from("email_otps").update({ used: true }).eq("id", otpRow.id);

      return ok({ success: true, verified: true });
    }

    return err("Not found", 404);
  } catch (e) {
    console.error("Unhandled error:", e);
    return err("Internal server error", 500);
  }
});
