export function makeSessionId(eventName: string, now = new Date()): string {
  const cleaned = eventName.trim().replace(/\s+/g, " ");
  const words = cleaned.split(" ").filter(Boolean);
  let prefix = "";

  if (words.length >= 2) {
    prefix = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    const w = words[0].replace(/[^a-zA-Z0-9]/g, "");
    prefix = (w.slice(0, 2) || "EV").toUpperCase();
  } else {
    prefix = "EV";
  }

  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");
  const SS = String(now.getSeconds()).padStart(2, "0");

  return `${prefix}-${yyyy}${mm}${dd}-${HH}${MM}${SS}`;
}
