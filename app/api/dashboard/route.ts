import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();

  const { data: sessionData, error: sessionErr } = await sb
    .from("sessions")
    .select("session_id,event_name,status,started_at")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1);

  if (sessionErr) return NextResponse.json({ error: sessionErr.message }, { status: 500 });

  if (!sessionData || sessionData.length === 0) {
    return NextResponse.json({ hasActive: false });
  }

  const active = sessionData[0];

  const { count: lguTotal, error: lguErr } = await sb
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (lguErr) return NextResponse.json({ error: lguErr.message }, { status: 500 });

  const { data: rows, error: attErr } = await sb
    .from("attendance")
    .select("employee_id,method,recorded_at,device_id,employees(full_name,department)")
    .eq("session_id", active.session_id)
    .order("recorded_at", { ascending: false });

  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  const totalRecorded = rows?.length ?? 0;
  let scanCount = 0;
  let manualCount = 0;

  const deptMap = new Map<string, { department: string; scan: number; manual: number; total: number }>();
  const latest = (rows || []).slice(0, 10).map((r: any) => ({
    employee_id: r.employee_id,
    method: r.method,
    recorded_at: r.recorded_at,
    device_id: r.device_id,
    full_name: r.employees?.full_name || "",
    department: r.employees?.department || "",
  }));

  for (const r of rows || []) {
    if (r.method === "scan") scanCount++;
    if (r.method === "manual") manualCount++;

    const dept = r.employees?.department || "Unassigned";
    const cur = deptMap.get(dept) || { department: dept, scan: 0, manual: 0, total: 0 };
    if (r.method === "scan") cur.scan++;
    if (r.method === "manual") cur.manual++;
    cur.total = cur.scan + cur.manual;
    deptMap.set(dept, cur);
  }

  const depts = Array.from(deptMap.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.scan !== a.scan) return b.scan - a.scan;
    return a.department.localeCompare(b.department);
  });

  const denom = lguTotal || 0;
  const pct = denom > 0 ? (totalRecorded / denom) * 100 : 0;

  return NextResponse.json({
    hasActive: true,
    session: active,
    totals: { totalRecorded, scanCount, manualCount, lguTotal: denom, completionPct: pct },
    departments: depts,
    latest,
  });
}
