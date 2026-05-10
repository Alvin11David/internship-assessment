import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunbird AI GenAI App",
  description: "Text/Audio Processing with AI Summarization & Translation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
