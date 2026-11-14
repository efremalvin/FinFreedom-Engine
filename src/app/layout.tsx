import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinFreedom Engine — Financial Independence & SWR Retirement Simulator",
  description: "Simulasi interaktif akumulasi dana Financial Freedom & Uji ketahanan SWR pensiun Indonesia.",
  icons: {
    icon: [
      { url: "/FinFreeLogo.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/FinFreeLogo.svg",
    shortcut: "/FinFreeLogo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
