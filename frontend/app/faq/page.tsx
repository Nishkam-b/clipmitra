import type { Metadata } from "next";
import Link from "next/link";
import { A, Bullets, InfoPage } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ · ClipMitra AI",
  description: "Is ClipMitra safe? How to install it, what it needs, and how your videos stay private.",
};

type QA = { q: string; a: React.ReactNode; open?: boolean };

const SAFETY: QA[] = [
  {
    q: "Is ClipMitra safe to install?",
    open: true,
    a: (
      <>
        <p>Yes. Here is exactly why, so you don&apos;t have to take our word for it:</p>
        <Bullets items={[
          <><b>It&apos;s open source.</b> Every line of code, including the installer, is public on <A href={SITE.repo}>GitHub</A> under the MIT license. Anyone can read what it does.</>,
          <><b>Your videos never leave your computer.</b> All AI processing runs on your own PC. Nothing is uploaded to us or to any cloud AI service.</>,
          <><b>No administrator rights.</b> The installer only writes to your own user folder (<code>%LOCALAPPDATA%\ClipMitra</code>). It can&apos;t change system files.</>,
          <><b>Well-known tools only.</b> It installs FFmpeg, Ollama, Deno and uv through <b>winget</b>, Microsoft&apos;s official Windows package manager, and downloads AI models from their official sources (Hugging Face, Ollama, Google MediaPipe).</>,
          <><b>Closed to the outside.</b> The ClipMitra engine only listens on <code>127.0.0.1</code>, so other devices on your network or the internet can&apos;t reach it. It also refuses requests from every website except nishtek.in.</>,
          <><b>No account, no tracking.</b> No sign-up, no cookies, no analytics. See the <Link href="/privacy" className="font-medium text-violet-700 hover:underline">Privacy Policy</Link>.</>,
          <><b>Easy to remove.</b> Uninstall any time from <i>Settings → Apps → ClipMitra AI</i>.</>,
        ]} />
      </>
    ),
  },
  {
    q: "Why does Windows say “Windows protected your PC”?",
    a: (
      <>
        <p>
          Windows shows this for programs that aren&apos;t <b>code-signed</b>. Code signing is a paid certificate (₹15,000+
          per year) that many small, free projects don&apos;t have yet. It doesn&apos;t mean the file is harmful: it means
          Windows doesn&apos;t recognise the publisher.
        </p>
        <p>Click <b>More info → Run anyway</b> to continue. If you want to double-check the file first:</p>
        <Bullets items={[
          <>Download it only from this site or the official <A href={SITE.releases}>GitHub releases page</A>.</>,
          <>Right-click the file → <b>Scan with Microsoft Defender</b>.</>,
          <>Compare its SHA-256 fingerprint with the one on the release page: open PowerShell and run <code>Get-FileHash ClipMitra-Setup.exe</code>.</>,
        ]} />
      </>
    ),
  },
  {
    q: "My browser asks to let nishtek.in “access apps on this device”. Should I allow it?",
    a: (
      <p>
        Yes, this is how the page talks to the ClipMitra engine running on <i>your</i> computer. The permission only lets
        nishtek.in reach apps on your own device; it doesn&apos;t give the site access to your files, camera or anything
        else. If you blocked it by mistake, click the icon at the left of the address bar, set <b>Local network access</b>
        to <b>Allow</b>, and reload.
      </p>
    ),
  },
  {
    q: "Does ClipMitra upload my videos anywhere?",
    a: (
      <p>
        No. Uploading a file in ClipMitra copies it from your computer to the ClipMitra engine <b>on the same computer</b>.
        Transcription, highlight finding, face tracking, captions and rendering all happen locally. Videos and clips are
        deleted automatically after {SITE.retentionHours} hours.
      </p>
    ),
  },
];

const GENERAL: QA[] = [
  {
    q: "Is ClipMitra free?",
    a: <p>Yes, completely free, with no limits, subscriptions or watermarks. It uses free, open-source AI models running on your own hardware, so there are no cloud costs to pass on.</p>,
  },
  {
    q: "What do I need to run it?",
    a: (
      <Bullets items={[
        "Windows 10 or 11 (64-bit).",
        "About 8 GB of free disk space (tools and AI models are ~4 GB).",
        "Recommended: an NVIDIA graphics card with 6 GB or more memory. Without one ClipMitra still works on the processor, just several times slower.",
        "An internet connection for the one-time setup (and for fetching video links).",
      ]} />
    ),
  },
  {
    q: "How do I install it?",
    a: (
      <>
        <p>
          <A href={SITE.setup}>Download ClipMitra-Setup.exe</A>, open it and click <b>Install</b>. Setup downloads what it
          needs (5–15 minutes) and puts a <b>ClipMitra</b> icon on your Desktop. Double-click that icon whenever you want to
          use it: it starts the engine and opens this page.
        </p>
        <p>
          If something goes wrong, the setup writes a log to <code>%LOCALAPPDATA%\ClipMitra\install.log</code>. Running the
          setup again continues where it stopped.
        </p>
      </>
    ),
  },
  {
    q: "Can I paste a YouTube or Instagram link?",
    a: (
      <p>
        Yes. ClipMitra can fetch videos from YouTube, Instagram, Facebook, X, Vimeo and direct video links, but{" "}
        <b>only use videos you own or have permission to use</b>. You confirm this with a checkbox before every fetch.
        Private videos, or ones that need a login, can&apos;t be fetched; download them yourself and upload the file.
      </p>
    ),
  },
  {
    q: "Why is there a 5-minute limit?",
    a: <p>ClipMitra is in its first version and is tuned for videos up to 5 minutes, so processing stays fast on everyday laptops. Longer videos are on the roadmap.</p>,
  },
  {
    q: "Does it work for Hindi and Hinglish?",
    a: <p>Yes. Hindi speech is captioned in Roman Hinglish (“itna aasan nahi tha”) by default. If the AI mishears a word, fix it in the clip editor under <b>Words</b>; the timing stays exact.</p>,
  },
  {
    q: "Are the AI results always correct?",
    a: <p>No AI is perfect. Captions can contain misheard words, and the chosen highlights or titles may not always be what you&apos;d pick. Watch each clip before posting; the editor lets you trim clips, fix words and restyle captions.</p>,
  },
  {
    q: "How do I update or uninstall?",
    a: <p>To update, download and run the latest setup again: your videos and clips are kept. To uninstall, go to <i>Settings → Apps → ClipMitra AI → Uninstall</i>; it asks whether to delete your clips too.</p>,
  },
  {
    q: "Who made ClipMitra? How do I get help?",
    a: (
      <p>
        ClipMitra is vibecoded by Nishkam Bhatia (<A href={SITE.instagram}>{SITE.instagramHandle}</A> on Instagram).
        Report bugs or ask questions on <A href={SITE.issues}>GitHub issues</A>, or send a DM on Instagram.
      </p>
    ),
  },
];

function FaqList({ items }: { items: QA[] }) {
  return (
    <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-white shadow-sm">
      {items.map(({ q, a, open }) => (
        <details key={q} open={open} className="group p-5 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:text-[13px]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-zinc-900">
            {q}
            <span className="text-violet-500 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 space-y-3 text-zinc-700">{a}</div>
        </details>
      ))}
    </div>
  );
}

export default function FaqPage() {
  return (
    <InfoPage title="Frequently asked questions" showUpdated={false}
              intro="Everything about installing ClipMitra, keeping your videos private, and getting great clips.">
      <section>
        <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">Safety &amp; privacy</h2>
        <FaqList items={SAFETY} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold tracking-tight text-zinc-900">Using ClipMitra</h2>
        <FaqList items={GENERAL} />
      </section>
    </InfoPage>
  );
}
