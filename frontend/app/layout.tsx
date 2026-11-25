import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClipMitra AI",
  description: "Turn long videos into short, captioned, vertical clips — locally.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full bg-white text-zinc-900">
        {/* Sidebar reads usePathname(); Next 16 requires URL hooks inside <Suspense>. */}
        <Suspense fallback={<div className="hidden w-[264px] shrink-0 md:block" />}>
          <Sidebar />
        </Suspense>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </main>
      </body>
    </html>
  );
}
