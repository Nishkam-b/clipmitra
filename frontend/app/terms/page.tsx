import type { Metadata } from "next";
import Link from "next/link";
import { A, Bullets, InfoPage, Section } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions · ClipMitra AI",
  description: "The terms for using ClipMitra AI, the free open-source video clipping tool.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      intro={
        <p>
          These terms apply when you use the ClipMitra website at <A href={SITE.url}>nishtek.in/clipmitra</A> or install and
          use the ClipMitra software. By using ClipMitra you agree to them. If you don&apos;t agree, please don&apos;t use it.
        </p>
      }
    >
      <Section title="1. What ClipMitra is">
        <p>
          ClipMitra AI is a free, open-source tool by {SITE.author} that turns longer videos into short vertical clips with
          captions. The software runs on your own computer; the website provides the interface. ClipMitra is provided free of
          charge and may change, be updated or be discontinued at any time.
        </p>
      </Section>

      <Section title="2. Open-source license">
        <p>
          ClipMitra&apos;s source code is released under the <A href={`${SITE.repo}/blob/main/LICENSE`}>MIT License</A>.
          Parts that ClipMitra installs or uses have their own licenses, which you agree to when you use them: FFmpeg,
          Ollama, Deno, uv, yt-dlp, the Whisper (MIT), Qwen3 (Apache-2.0) and MediaPipe (Apache-2.0) models, and the
          bundled Google Fonts (SIL Open Font License). The “ClipMitra” and “Nishtek” names and logos are not covered by the
          MIT License.
        </p>
      </Section>

      <Section title="3. Your content and your responsibilities">
        <Bullets items={[
          <><b>You must own, or have permission to use, every video you process</b>, including videos fetched from links. You confirm this each time you fetch a link.</>,
          "You are responsible for following the terms of the platforms you fetch from (for example YouTube, Instagram, Facebook, X or Vimeo) and the platforms you post clips to.",
          "Don't use ClipMitra to infringe copyright, invade privacy, harass anyone, create misleading or illegal content, or break any law.",
          "You keep all rights to your videos and the clips you create. We claim no ownership and never receive your content.",
        ]} />
      </Section>

      <Section title="4. AI-generated output">
        <p>
          Captions, highlight choices, titles and hooks are produced automatically by AI models and may be inaccurate,
          incomplete or unsuitable. Review every clip before you publish it. You are responsible for what you post.
        </p>
      </Section>

      <Section title="5. Your computer">
        <p>
          Installing ClipMitra downloads about 4 GB of software and AI models and uses your processor, graphics card,
          memory and disk while it runs. Make sure your computer meets the requirements in the{" "}
          <Link href="/faq" className="font-medium text-violet-700 hover:underline">FAQ</Link>, and keep backups of anything
          important. You can uninstall ClipMitra at any time from <i>Settings → Apps</i>.
        </p>
      </Section>

      <Section title="6. No warranty">
        <p>
          ClipMitra is provided <b>“as is” and “as available”</b>, without warranties of any kind, express or implied,
          including warranties of merchantability, fitness for a particular purpose, accuracy or non-infringement. We
          don&apos;t guarantee that it will be error-free, uninterrupted or compatible with every computer.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {SITE.author} and contributors are not liable for any indirect,
          incidental, special or consequential damages, or for any loss of data, content, profits or reputation, arising
          from your use of ClipMitra or of content you create with it. ClipMitra is free; where liability cannot be
          excluded, it is limited to the amount you paid to use ClipMitra, which is zero.
        </p>
      </Section>

      <Section title="8. Privacy">
        <p>
          How ClipMitra handles information is explained in the{" "}
          <Link href="/privacy" className="font-medium text-violet-700 hover:underline">Privacy Policy</Link>. In short,
          your videos are processed on your own computer and are never sent to us.
        </p>
      </Section>

      <Section title="9. Changes">
        <p>
          We may update these terms. The “Last updated” date above shows the latest version, and the full history is public
          on <A href={SITE.repo}>GitHub</A>. Continuing to use ClipMitra after a change means you accept the updated terms.
        </p>
      </Section>

      <Section title="10. Governing law">
        <p>These terms are governed by the laws of India.</p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these terms: open an issue on <A href={SITE.issues}>GitHub</A> or message{" "}
          <A href={SITE.instagram}>{SITE.instagramHandle}</A> on Instagram.
        </p>
      </Section>
    </InfoPage>
  );
}
