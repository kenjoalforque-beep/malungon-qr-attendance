import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabaseServer";

function csvEscape(v: any) {
  const s = (v ?? "").toString();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const url = new URL(req.url);
  const session_id_param = url.searchParams.get("session_id")?.trim();

  const sb = supabaseServer();

  let session_id = session_id_param;
  let event_name = "";

  if (!session_id) {
    const { data, error } = await sb
      .from("sessions")
      .select("session_id,event_name,status,started_at")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: "No active session" }, { status: 400 });

    session_id = data[0].session_id;
    event_name = data[0].event_name;
  } else {
    const { data, error } = await sb.from("sessions").select("event_name").eq("session_id", session_id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    event_name = data?.event_name || "";
  }

  const { data: rows, error } = await sb
    .from("attendance")
    .select("employee_id,method,device_id,recorded_at,employees(full_name,department)")
    .eq("session_id", session_id)
    .order("recorded_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["Session ID", "Event Name", "Employee ID", "Full Name", "Department", "Method", "Device ID", "Recorded At"];
  const lines = [header.join(",")];

  for (const r of rows || []) {
    lines.push([
      csvEscape(session_id),
      csvEscape(event_name),
      csvEscape(r.employee_id),
      csvEscape((r as any).employees?.full_name || ""),
      csvEscape((r as any).employees?.department || ""),
      csvEscape(r.method),
      csvEscape(r.device_id),
      csvEscape(r.recorded_at),
    ].join(","));
  }

  const csv = lines.join("\n");
  const safeEvent = (event_name || "Event").replace(/[^a-zA-Z0-9_-]+/g, "");
  const filename = `${session_id}_${safeEvent}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
