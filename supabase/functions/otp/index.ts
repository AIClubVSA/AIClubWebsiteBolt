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

    // Check whether a profile/account exists for a given email.
    // Used by the client before sending OTP to give a friendlier error message.
    // Uses service role so it can query profiles without auth.
    if (action === "check") {
      const body = await req.json();
      const email = String(body.email ?? "").toLowerCase().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return err("invalid email address");
      }

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      return ok({ exists: data !== null });
    }

    return err("Not found", 404);
  } catch (e) {
    console.error("Unhandled error:", (e as Error).message);
    return err("Internal server error", 500);
  }
});
