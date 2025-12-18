import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { employee_id?: string; method?: "scan" | "manual"; device_id?: string } | null;
  const employee_id = body?.employee_id?.trim();
  const method = body?.method;
  const device_id = body?.device_id?.trim();

  if (!employee_id) return NextResponse.json({ status: "error", message: "Employee ID required" }, { status: 400 });
  if (!device_id) return NextResponse.json({ status: "error", message: "Device ID required" }, { status: 400 });
  if (method !== "scan" && method !== "manual") return NextResponse.json({ status: "error", message: "Invalid method" }, { status: 400 });

  const sb = supabaseServer();

  const { data: sessionData, error: sessionErr } = await sb
    .from("sessions")
    .select("session_id,event_name,status,started_at")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1);

  if (sessionErr) return NextResponse.json({ status: "error", message: sessionErr.message }, { status: 500 });
  if (!sessionData || sessionData.length === 0) return NextResponse.json({ status: "error", message: "No active session" }, { status: 200 });

  const active = sessionData[0];

  // Employee exists?
  const { data: emp, error: empErr } = await sb
    .from("employees")
    .select("employee_id,full_name,department,status")
    .eq("employee_id", employee_id)
    .maybeSingle();

  if (empErr) return NextResponse.json({ status: "error", message: empErr.message }, { status: 500 });
  if (!emp || emp.status !== "active") {
    return NextResponse.json({ status: "invalid", message: "Invalid ID/QR" }, { status: 200 });
  }

  // Duplicate check (do NOT record duplicates)
  const { data: existing, error: exErr } = await sb
    .from("attendance")
    .select("recorded_at,method,device_id")
    .eq("session_id", active.session_id)
    .eq("employee_id", employee_id)
    .maybeSingle();

  if (exErr) return NextResponse.json({ status: "error", message: exErr.message }, { status: 500 });
  if (existing) {
    return NextResponse.json({
      status: "duplicate",
      message: "Duplicate",
      already_recorded_at: existing.recorded_at,
      employee: { employee_id: emp.employee_id, full_name: emp.full_name, department: emp.department },
      session: active,
    });
  }

  const { error: insErr, data: inserted } = await sb
    .from("attendance")
    .insert({
      session_id: active.session_id,
      employee_id,
      method,
      device_id,
    })
    .select("recorded_at")
    .single();

  if (insErr) {
    // if unique constraint triggered, treat as duplicate
    if (insErr.message.toLowerCase().includes("duplicate") || insErr.code === "23505") {
      return NextResponse.json({
        status: "duplicate",
        message: "Duplicate",
        already_recorded_at: new Date().toISOString(),
        employee: { employee_id: emp.employee_id, full_name: emp.full_name, department: emp.department },
        session: active,
      });
    }
    return NextResponse.json({ status: "error", message: insErr.message }, { status: 500 });
  }

  // Upsert device
  await sb.from("devices").upsert({ device_id, last_seen: new Date().toISOString() }, { onConflict: "device_id" });

  return NextResponse.json({
    status: "ok",
    message: "Recorded",
    recorded_at: inserted?.recorded_at,
    employee: { employee_id: emp.employee_id, full_name: emp.full_name, department: emp.department },
    session: active,
  });
}
