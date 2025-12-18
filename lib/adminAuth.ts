import { NextRequest } from "next/server";

export function requireAdmin(req: NextRequest): { ok: true } | { ok: false; error: string } {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return { ok: false, error: "Server misconfigured: ADMIN_PIN missing" };

  // Accept pin from header or query or json body field (API handlers decide which).
  const headerPin = req.headers.get("x-admin-pin");
  if (headerPin && headerPin === pin) return { ok: true };

  const url = new URL(req.url);
  const qPin = url.searchParams.get("pin");
  if (qPin && qPin === pin) return { ok: true };

  return { ok: false, error: "Unauthorized" };
}
