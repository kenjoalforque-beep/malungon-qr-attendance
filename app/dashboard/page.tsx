"use client";

import { useEffect, useState } from "react";
import SessionHeader from "@/components/SessionHeader";

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}
function fmtDT(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/dashboard", { cache: "no-store" });
    const d = await res.json();
    setData(d);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <SessionHeader title="HR Dashboard" />
      <div className="container">
        {!data?.hasActive ? (
          <div className="card">
            <p className="h2">No active session</p>
            <p className="muted">Waiting for admin to start a session.</p>
          </div>
        ) : (
          <>
            <div className="row">
              <div className="col">
                <div className="card">
                  <p className="muted">LGU Total Recorded</p>
                  <p className="kpi">{data.totals.totalRecorded}</p>
                  <p className="muted">
                    {data.totals.totalRecorded} / {data.totals.lguTotal} ({fmtPct(data.totals.completionPct)})
                  </p>
                </div>
              </div>

              <div className="col">
                <div className="card">
                  <p className="muted">Scan count</p>
                  <p className="kpi">{data.totals.scanCount}</p>
                </div>
              </div>

              <div className="col">
                <div className="card">
                  <p className="muted">Manual entry count</p>
                  <p className="kpi">{data.totals.manualCount}</p>
                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="col">
                <div className="card">
                  <p className="h2">Department progress (highest first)</p>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Scan</th>
                        <th>Manual</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.departments || []).map((r: any) => (
                        <tr key={r.department}>
                          <td>{r.department}</td>
                          <td>{r.scan}</td>
                          <td>{r.manual}</td>
                          <td><b>{r.total}</b></td>
                        </tr>
                      ))}
                      {(data.departments || []).length === 0 ? (
                        <tr><td colSpan={4} className="muted">No records yet.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col">
                <div className="card">
                  <p className="h2">Latest recorded</p>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Name</th>
                        <th>Dept</th>
                        <th>M</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.latest || []).map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td>{fmtDT(r.recorded_at)}</td>
                          <td>{r.full_name}</td>
                          <td>{r.department}</td>
                          <td>{r.method === "manual" ? "MAN" : "SCAN"}</td>
                        </tr>
                      ))}
                      {(data.latest || []).length === 0 ? (
                        <tr><td colSpan={4} className="muted">No records yet.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                  <p className="muted">Updates every 2 seconds.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
