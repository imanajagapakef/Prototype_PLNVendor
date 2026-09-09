import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vendor Operations Portal — Demo",
  description:
    "DEMO WORKFLOW: PLN vendor contract collaboration prototype with fictional data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <p className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <PlugZap className="size-4 text-accent" aria-hidden />
              Vendor Operations Portal
            </p>
            <Badge tone="warn">DEMO WORKFLOW · Preliminary Mapping</Badge>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line bg-surface">
          <p className="mx-auto w-full max-w-6xl px-4 py-3 text-xs text-muted sm:px-6">
            Prototype validation only — fictional contract, vendor, and
            documents. No real PLN data, signatures, or financial integration.
          </p>
        </footer>
      </body>
    </html>
  );
}
