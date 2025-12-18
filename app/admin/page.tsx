"use client";

import { useEffect, useState } from "react";
import SessionHeader from "@/components/SessionHeader";
import { useDeviceId } from "@/components/useDeviceId";

const PIN_KEY = "admin_pin";

export default function AdminPage() {
  const deviceId = useDeviceId();

  const [pin, setPin] = useState("");
  const [eventName, setEventName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved PIN
  useEffect(() => {
    const saved = sessionStorage.getItem(PIN_KEY) || "";
    setPin(saved);
  }, []);

  // Fetch active session on load
  useEffect(() => {
    refreshActive();
  }, []);

  async function refreshActive() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/active-session");
      const data = await res.json();
      setActiveSession(data?.session || null);
    } catch {
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  }

  async function startSession() {
    setMsg(null);

    if (!eventName.trim()) {
      setMsg("Event name is required.");
      return;
    }

    const res = await fetch("/api/admin/start-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": pin,
      },
      body: JSON.stringify({
        event_name: eventName.trim(),
        device_id: deviceId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || "Failed to start session.");
      return;
    }

    await refreshActive();
  }

  async function endSession() {
    if (!confirm("End the current session?")) return;

    setMsg(null);

    const res = await fetch("/api/admin/end-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": pin,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || "Failed to end session.");
      return;
    }

    setEventName("");
    await refreshActive();
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <SessionHeader />

      <div>
        <label className="block text-sm font-medium">Admin PIN</label>
        <input
          type="password"
          className="border p-2 w-full"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            sessionStorage.setItem(PIN_KEY, e.target.value);
          }}
          placeholder="Enter admin PIN"
        />
      </div>

      {loading ? (
        <p>Loading session…</p>
      ) : activeSession ? (
        <>
          <div className="border p-3 rounded bg-gray-50">
            <p>
              <strong>Event:</strong> {activeSession.event_name}
            </p>
            <p>
              <strong>Session ID:</strong> {activeSession.session_id}
            </p>
            <p className="text-green-600 font-semibold">LIVE</p>
          </div>

          <button
            onClick={endSession}
            className="bg-red-600 text-white px-4 py-2 rounded w-full"
          >
            End Session
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium">Event Name</label>
            <input
              type="text"
              className="border p-2 w-full"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Flag Raising"
            />
          </div>

          <button
            onClick={startSession}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            Start Session
          </button>
        </>
      )}

      {msg && <p className="text-red-600">{msg}</p>}
    </div>
  );
}
