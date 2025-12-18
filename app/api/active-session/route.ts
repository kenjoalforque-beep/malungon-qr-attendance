import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("sessions")
    .select("session_id,event_name,status,started_at")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ hasActive: false, error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ hasActive: false });
  }

  const s = data[0];
  return NextResponse.json({ hasActive: true, ...s });
}
