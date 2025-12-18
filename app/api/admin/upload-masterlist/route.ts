import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabaseServer";
import { parse } from "csv-parse/sync";

type Row = { employee_id?: string; full_name?: string; department?: string; status?: string };

function normHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "CSV file is required" }, { status: 400 });

  const text = await file.text();
  let records: any[] = [];
  try {
    records = parse(text, { columns: (headers: string[]) => headers.map(normHeader), skip_empty_lines: true, trim: true });
  } catch (e: any) {
    return NextResponse.json({ error: `CSV parse error: ${e?.message || "unknown"}` }, { status: 400 });
  }

  const toUpsert: any[] = [];
  const errors: string[] = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i] as Row;
    const employee_id = (r.employee_id || "").toString().trim();
    const full_name = (r.full_name || "").toString().trim();
    const department = (r.department || "").toString().trim();
    const status = (r.status || "active").toString().trim() || "active";

    if (!employee_id || !full_name || !department) {
      errors.push(`Row ${i + 2}: missing employee_id/full_name/department`);
      continue;
    }
    toUpsert.push({ employee_id, full_name, department, status, updated_at: new Date().toISOString() });
  }

  if (toUpsert.length === 0) {
    return NextResponse.json({ error: "No valid rows to import", row_errors: errors }, { status: 400 });
  }

  const sb = supabaseServer();
  const { error } = await sb.from("employees").upsert(toUpsert, { onConflict: "employee_id" });

  if (error) return NextResponse.json({ error: error.message, row_errors: errors }, { status: 400 });

  return NextResponse.json({
    ok: true,
    imported: toUpsert.length,
    row_errors: errors,
    note: "Upserted by employee_id. Scanning uses Employee ID encoded in QR.",
  });
}
