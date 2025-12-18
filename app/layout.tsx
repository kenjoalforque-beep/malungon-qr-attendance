import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Malungon QR Attendance",
  description: "Standalone QR attendance for LGU Malungon",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
