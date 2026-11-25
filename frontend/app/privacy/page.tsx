import type { Metadata } from "next";
import { A, Bullets, InfoPage, Section } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy · ClipMitra AI",
  description: "ClipMitra processes your videos on your own computer. We don't collect, upload or sell your data.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro={
        <p>
          <b>The short version:</b> ClipMitra runs on your own computer. Your videos, transcripts and clips stay on your
          device. We don&apos;t have accounts, we don&apos;t use cookies or analytics, and we never receive your videos.
        </p>
      }
    >
      <Section title="1. Who we are">
        <p>
          ClipMitra AI (“ClipMitra”, “we”) is a free, open-source tool made by {SITE.author}. It consists of a website at{" "}
          <A href={SITE.url}>nishtek.in/clipmitra</A> (the interface) and the ClipMitra engine, which you install on your
          own Windows computer and which does all the processing.
        </p>
      </Section>

      <Section title="2. Your videos and clips stay on your computer">
        <Bullets items={[
          "Videos you upload are copied to the ClipMitra engine running on your own computer, not to us or any server.",
          "Transcription (Whisper), highlight selection (Qwen3 via Ollama), face tracking (MediaPipe), captions and rendering (FFmpeg) all run locally.",
          <>Files are stored in <code>%LOCALAPPDATA%\ClipMitra\data</code> and are <b>deleted automatically after {SITE.retentionHours} hours</b>. You can delete them sooner by deleting that folder, or by choosing to delete your clips when you uninstall.</>,
          "We never see the content of your videos, your transcripts, your clips or your caption edits.",
        ]} />
      </Section>

      <Section title="3. What the website collects">
        <Bullets items={[
          <><b>No accounts, no cookies, no analytics, no advertising trackers.</b> The ClipMitra pages don&apos;t store anything in your browser.</>,
          <>The website is static and hosted on <b>GitHub Pages</b>. Like any web host, GitHub may log technical information such as your IP address and browser type when you load the pages. This is governed by the <A href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">GitHub Privacy Statement</A>; we don&apos;t receive or use these logs.</>,
          <>The page connects to <code>127.0.0.1</code>, which is your own computer, to talk to the ClipMitra engine. Your browser asks for permission (“local network access”) before this works.</>,
        ]} />
      </Section>

      <Section title="4. Connections ClipMitra makes from your computer">
        <p>ClipMitra contacts these third-party services only when needed. We don&apos;t control them, and their own privacy policies apply:</p>
        <Bullets items={[
          <><b>During setup:</b> Microsoft winget (to install FFmpeg, Ollama, Deno and uv), GitHub (ClipMitra&apos;s code), Hugging Face (Whisper speech model), Ollama (Qwen3 model) and Google Cloud Storage (MediaPipe face model). These are downloads; your videos are not sent.</>,
          <><b>When you paste a video link:</b> your computer downloads that video directly from the platform you chose (for example YouTube or Instagram), using the open-source yt-dlp tool. That platform sees the request as coming from your internet connection.</>,
          "Nothing else: the AI models run offline once they are downloaded.",
        ]} />
      </Section>

      <Section title="5. Information you choose to send us">
        <p>
          If you contact us (for example through <A href={SITE.issues}>GitHub issues</A> or an Instagram message), we only
          use what you send to reply and to improve ClipMitra. GitHub issues are public, so please don&apos;t include private
          information or attach private videos. If you share your <code>install.log</code>, check it first: it contains file
          paths on your computer, which may include your Windows user name.
        </p>
      </Section>

      <Section title="6. Children">
        <p>ClipMitra is not directed at children under 13, and we don&apos;t knowingly collect information from anyone.</p>
      </Section>

      <Section title="7. Your rights">
        <p>
          Because we don&apos;t collect or store your personal data, there is nothing for us to access, correct or delete on
          our side. Everything ClipMitra stores is on your computer and under your control.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          If ClipMitra starts handling data differently, we will update this page and the “Last updated” date. The full
          history of changes is public in the <A href={SITE.repo}>GitHub repository</A>.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions about privacy: open an issue on <A href={SITE.issues}>GitHub</A> or message{" "}
          <A href={SITE.instagram}>{SITE.instagramHandle}</A> on Instagram.
        </p>
      </Section>
    </InfoPage>
  );
}
