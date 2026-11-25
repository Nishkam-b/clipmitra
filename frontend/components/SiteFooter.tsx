import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-100 px-6 py-6 text-sm text-zinc-500 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          Vibecoded by{" "}
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer"
             className="font-semibold text-violet-700 hover:underline" title={`${SITE.instagramHandle} on Instagram`}>
            Nishkam
          </a>
          {" "}· Free &amp; open source
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link href="/faq" className="hover:text-violet-700">FAQ</Link>
          <Link href="/privacy" className="hover:text-violet-700">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-violet-700">Terms &amp; Conditions</Link>
          <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="hover:text-violet-700">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
