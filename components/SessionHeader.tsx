"use client";

import { useEffect, useState } from "react";

type ActiveSession = {
  hasActive: boolean;
  event_name?: string;
  session_id?: string;
  status?: "active" | "closed";
  started_at?: string;
};

function formatDT(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" });
}

export default function SessionHeader({ title }: { title: string }) {
  const [s, setS] = useState<ActiveSession>({ hasActive: false });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const res = await fetch("/api/active-session", { cache: "no-store" });
    const data = await res.json();
    setS(data);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const badge =
    s.hasActive ? (
      <span className={`badge ${s.status === "active" ? "live" : "closed"}`}>{s.status === "active" ? "LIVE" : "CLOSED"}</span>
    ) : (
      <span className="badge none">NO ACTIVE SESSION</span>
    );

  return (
    <div className="headerbar">
      <div className="headerinner">
        <div>
          <div style={{ fontWeight: 900 }}>{title}</div>
          {s.hasActive ? (
            <div className="small">
              {s.event_name} · Session: {s.session_id} · Started: {formatDT(s.started_at)}
            </div>
          ) : (
            <div className="small">No session started.</div>
          )}
          <div className="small">Now: {now.toLocaleString()}</div>
        </div>
        <div>{badge}</div>
      </div>
    </div>
  );
}
