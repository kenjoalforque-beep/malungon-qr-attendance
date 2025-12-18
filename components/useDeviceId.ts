"use client";

import { useEffect, useState } from "react";

const KEY = "malungon_device_id_v1";

function makeRandomId() {
  const a = crypto.getRandomValues(new Uint8Array(10));
  const b = Array.from(a).map(x => x.toString(16).padStart(2, "0")).join("");
  const c = crypto.getRandomValues(new Uint8Array(6));
  const d = Array.from(c).map(x => x.toString(16).padStart(2, "0")).join("");
  return `manual:dev-${b}-${d}`;
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    let v = localStorage.getItem(KEY) || "";
    if (!v) {
      v = makeRandomId();
      localStorage.setItem(KEY, v);
    }
    setDeviceId(v);
  }, []);

  function update(newId: string) {
    const v = newId.trim();
    localStorage.setItem(KEY, v);
    setDeviceId(v);
  }

  return { deviceId, update, makeRandomId };
}
