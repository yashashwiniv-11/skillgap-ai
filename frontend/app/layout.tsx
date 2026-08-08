import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillGap AI",
  description: "AI-powered skill gap analyzer for career growth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
