"use client";

import { useEffect, useState } from "react";
import SessionHeader from "@/components/SessionHeader";
import { useDeviceId } from "@/components/useDeviceId";

const PIN_KEY = "malungon_admin_pin_v1";

export default function AdminPage() {
  const { deviceId, update: setDeviceId, makeRandomId } = useDeviceId();
  const [pin, setPin] = useState("");
  const [eventName, setEventName] = useState("");
  const [msg, setMsg] = useState<{ type: "green" | "yellow" | "red"; text: string } | null>(null);
  const [active, setActive] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(PIN_KEY) || "";
    setPin(saved);
  }, []);

  function savePin(v: string) {
    setPin(v);
    sessionStorage.setItem(PIN_KEY, v);
  }

  async function refreshActive() {
    const res = await fetch("/api/active-session", { cache: "no-store" });
    const data = await res.json();
    setActive(data?.hasActive ? data : null);
  }

  useEffect(() => { refreshActive(); }, []);

  async function startSession() {
    setMsg(null);
    const res = await fetch("/api/admin/start-session", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ event_name: eventName, device_id: deviceId }),
    });
    const data = await res.json();
    if (!res.ok || data?.error) {
      setMsg({ type: "red", text: data?.error || "Failed to start session" });
      await refreshActive();
      return;
    }
    setMsg({ type: "green", text: `Session started: ${data.session.session_id}` });
    setEventName("");
    await refreshActive();
  }

  async function endSession() {
  setMsg(null);

  const res = await fetch("/api/admin/end-session", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
  });

  if (!res.ok) {
    const data = await res.json();
    setMsg(data.error || "Failed to end session");
    return;
  }

  setEventName("");
  await refreshActive();
}


  async function exportCsv() {
    const url = active?.session_id ? `/api/admin/export?session_id=${encodeURIComponent(active.session_id)}&pin=${encodeURIComponent(pin)}` : `/api/admin/export?pin=${encodeURIComponent(pin)}`;
    window.location.href = url;
  }

  async function uploadMasterlist(file: File) {
    setUploadResult(null);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/upload-masterlist", { method: "POST", headers: { "x-admin-pin": pin }, body: fd });
    const data = await res.json();
    if (!res.ok || data?.error) {
      setMsg({ type: "red", text: data?.error || "Upload failed" });
      setUploadResult(data);
      return;
    }
    setMsg({ type: "green", text: `Masterlist updated. Imported: ${data.imported}` });
    setUploadResult(data);
  }

  return (
    <>
      <SessionHeader title="Admin" />
      <div className="container">
        <div className="row">
          <div className="col">
            <div className="card">
              <p className="h2">Admin PIN</p>
              <input className="input" placeholder="Enter PIN" value={pin} onChange={(e) => savePin(e.target.value)} />
              <p className="muted">Stored in this browser session only.</p>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <p className="h2">Device ID</p>
              <input className="input" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn secondary" onClick={() => setDeviceId(makeRandomId())}>Generate new</button>
              </div>
              <p className="muted">This identifies the scanner/admin device.</p>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <p className="h2">Session control</p>
              {active?.hasActive ? (
                <>
                  <p className="muted">Active session: <b>{active.session_id}</b></p>
                  <button className="btn danger" onClick={endSession}>End current session</button>
                  <button className="btn secondary" style={{ marginLeft: 8 }} onClick={exportCsv}>Export CSV</button>
                </>
              ) : (
                <>
                  <input className="input" placeholder="Event name (e.g., Flag Raising)" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                  <div style={{ height: 10 }} />
                  <button className="btn" onClick={startSession} disabled={!eventName || !pin || !deviceId}>Start session</button>
                  <p className="muted">You must end the current session before starting another.</p>
                </>
              )}
            </div>

            {msg && (
              <div className={`feedback ${msg.type}`} style={{ marginTop: 12 }}>
                <b>{msg.text}</b>
              </div>
            )}
          </div>

          <div className="col">
            <div className="card">
              <p className="h2">Upload masterlist (CSV)</p>
              <p className="muted">Required columns: <b>employee_id</b>, <b>full_name</b>, <b>department</b>. Optional: status (active/inactive).</p>
              <input
                className="input"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMasterlist(f);
                }}
              />
              {uploadResult?.row_errors?.length ? (
                <div style={{ marginTop: 10 }}>
                  <p className="muted">Row errors (not imported):</p>
                  <div className="card" style={{ background: "#0e1520" }}>
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12 }}>{uploadResult.row_errors.join("\n")}</pre>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <p className="h2">Quick links</p>
              <div className="row">
                <a className="btn secondary" href="/scanner">Open scanner</a>
                <a className="btn secondary" href="/dashboard">Open HR dashboard</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
