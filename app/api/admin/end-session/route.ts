import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await req.json().catch(() => null) as { session_id?: string } | null;
  const session_id = body?.session_id?.trim();
  if (!session_id) return NextResponse.json({ error: "session_id is required" }, { status: 400 });

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("sessions")
    .update({ status: "closed", ended_at: new Date().toISOString() })
    .eq("session_id", session_id)
    .eq("status", "active")
    .select("session_id,event_name,status,started_at,ended_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, session: data });
}
