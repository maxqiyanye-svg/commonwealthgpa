import type { Metadata } from "next";
import "./globals.css";
import MadeByBadge from "@/components/MadeByBadge";

export const metadata: Metadata = {
  title: "Commonwealth GPA",
  description: "Course tracking, GPA calculation, and grade trends.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">
        {children}
        <MadeByBadge />
      </body>
    </html>
  );
}
