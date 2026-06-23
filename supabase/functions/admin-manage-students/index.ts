import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!callerProfile || callerProfile.role !== "admin") return json({ error: "Forbidden" }, 403);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { action, email, full_name, phone, userId } = await req.json();

  // ── CREATE ──────────────────────────────────────────────────────────────────
  if (action === "create") {
    if (!email?.trim() || !full_name?.trim()) {
      return json({ error: "Email and full name are required" }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing) return json({ error: "A student with that email already exists" }, 400);

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim(), phone: phone?.trim() || null },
    });
    if (createError) return json({ error: createError.message }, 400);

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userData.user.id,
      email: normalizedEmail,
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      role: "student",
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return json({ error: "Failed to create student profile" }, 500);
    }
    return json({ success: true, userId: userData.user.id });
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  if (action === "update") {
    if (!userId) return json({ error: "userId is required" }, 400);
    if (!full_name?.trim() && !email?.trim() && phone === undefined) {
      return json({ error: "Nothing to update" }, 400);
    }

    const updates: Record<string, string | null> = {};
    if (full_name?.trim()) updates.full_name = full_name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (email?.trim()) updates.email = email.toLowerCase().trim();

    if (email?.trim()) {
      const normalizedEmail = email.toLowerCase().trim();

      // Check email not taken by another account
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .neq("id", userId)
        .maybeSingle();
      if (existing) return json({ error: "That email is already in use" }, 400);

      // Update auth email
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: normalizedEmail,
        email_confirm: true,
      });
      if (authUpdateError) return json({ error: authUpdateError.message }, 400);
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (profileError) return json({ error: profileError.message }, 400);

    return json({ success: true });
  }

  // ── DELETE ──────────────────────────────────────────────────────────────────
  if (action === "delete") {
    if (!userId) return json({ error: "userId is required" }, 400);

    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) return json({ error: deleteError.message }, 400);

    return json({ success: true });
  }

  return json({ error: "Invalid action" }, 400);
});
