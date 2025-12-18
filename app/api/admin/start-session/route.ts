import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabaseServer";
import { makeSessionId } from "@/lib/sessionId";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await req.json().catch(() => null) as { event_name?: string; device_id?: string } | null;
  const event_name = body?.event_name?.trim();
  const device_id = body?.device_id?.trim();

  if (!event_name) return NextResponse.json({ error: "Event name is required" }, { status: 400 });
  if (!device_id) return NextResponse.json({ error: "Device ID is required" }, { status: 400 });

  const sb = supabaseServer();
  const session_id = makeSessionId(event_name, new Date());

  const { data, error } = await sb
    .from("sessions")
    .insert({
      session_id,
      event_name,
      status: "active",
      started_by_device_id: device_id,
    })
    .select("session_id,event_name,status,started_at")
    .single();

  if (error) {
    // Most common: one_active_session_idx prevents 2 active sessions
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Upsert device last_seen
  await sb.from("devices").upsert({ device_id, last_seen: new Date().toISOString() }, { onConflict: "device_id" });

  return NextResponse.json({ ok: true, session: data });
}
