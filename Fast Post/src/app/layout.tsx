import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastPost",
  description: "SaaS de agendamento automatico em massa para social media"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
