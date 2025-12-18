import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <p className="h1">Malungon QR Attendance</p>
        <p className="muted">Choose a screen.</p>
        <div className="row">
          <Link className="btn" href="/scanner">Scanner</Link>
          <Link className="btn secondary" href="/dashboard">HR Dashboard</Link>
          <Link className="btn secondary" href="/admin">Admin</Link>
        </div>
      </div>
    </div>
  );
}
