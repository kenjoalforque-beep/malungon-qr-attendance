"use client";

import { useEffect, useRef, useState } from "react";
import SessionHeader from "@/components/SessionHeader";
import { useDeviceId } from "@/components/useDeviceId";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type Feedback =
  | { type: "green"; title: string; detail?: string }
  | { type: "yellow"; title: string; detail?: string }
  | { type: "red"; title: string; detail?: string }
  | null;

function formatDT(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default function ScannerPage() {
  const { deviceId } = useDeviceId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [manualId, setManualId] = useState("");

  async function record(employeeId: string, method: "scan" | "manual") {
    const res = await fetch("/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId, method, device_id: deviceId }),
    });
    const data = await res.json();

    if (data.status === "ok") {
      setFeedback({
        type: "green",
        title: "Recorded",
        detail: `${data.employee.full_name} · ${data.employee.department}`,
      });
      return;
    }
    if (data.status === "duplicate") {
      setFeedback({
        type: "yellow",
        title: "Duplicate",
        detail: `Already recorded at ${formatDT(data.already_recorded_at)}`,
      });
      return;
    }
    if (data.status === "invalid") {
      setFeedback({ type: "red", title: "Invalid", detail: "Invalid ID/QR" });
      return;
    }
    setFeedback({ type: "red", title: "Error", detail: data.message || "Something went wrong" });
  }

  async function start() {
    if (!videoRef.current) return;
    setFeedback(null);

    const reader = new BrowserMultiFormatReader();
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    const preferred = devices[0]?.deviceId;

    const controls = await reader.decodeFromVideoDevice(preferred || null, videoRef.current, async (result, err, ctrl) => {
      if (result) {
        const text = result.getText().trim();
        // QR value is Employee ID
        await record(text, "scan");
        // small cooldown to avoid rapid re-reads
        ctrl.stop();
        setIsRunning(false);
      }
    });

    controlsRef.current = controls;
    setIsRunning(true);
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsRunning(false);
  }

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <>
      <SessionHeader title="Scanner" />
      <div className="container">
        <div className="row">
          <div className="col">
            <div className="card">
              <p className="h2">Camera scan</p>
              <video ref={videoRef} style={{ width: "100%", borderRadius: 14, border: "1px solid var(--border)" }} />
              <div className="row" style={{ marginTop: 10 }}>
                {!isRunning ? (
                  <button className="btn" onClick={start} disabled={!deviceId}>Start scan</button>
                ) : (
                  <button className="btn danger" onClick={stop}>Stop</button>
                )}
                <button className="btn secondary" onClick={() => setFeedback(null)}>Clear</button>
              </div>
              <p className="muted">QR should contain the Employee ID.</p>
            </div>

            {feedback && (
              <div className={`feedback ${feedback.type}`} style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{feedback.title}</div>
                {feedback.detail ? <div className="muted" style={{ marginTop: 4 }}>{feedback.detail}</div> : null}
              </div>
            )}
          </div>

          <div className="col">
            <div className="card">
              <p className="h2">Manual entry</p>
              <input
                className="input"
                placeholder="Employee ID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = manualId.trim();
                    if (v) {
                      record(v, "manual");
                      setManualId("");
                    }
                  }
                }}
              />
              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn"
                  onClick={() => {
                    const v = manualId.trim();
                    if (v) {
                      record(v, "manual");
                      setManualId("");
                    }
                  }}
                  disabled={!manualId.trim()}
                >
                  Submit
                </button>
                <button className="btn secondary" onClick={() => setManualId("")}>Clear</button>
              </div>
              <p className="muted">Enter Employee ID, then submit. (Green=recorded, Yellow=duplicate, Red=invalid.)</p>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <p className="h2">Device</p>
              <p className="muted">{deviceId || "Loading device ID..."}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
