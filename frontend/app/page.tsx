import { UploadCard } from "@/components/UploadCard";
import {
  ArrowRightIcon, BoltIcon, CcIcon, FrameIcon, LayersIcon, ScissorsIcon, SparkIcon, UploadIcon,
} from "@/components/icons";

const FEATURES = [
  { Icon: ScissorsIcon, label: "Finds Best Moments" },
  { Icon: CcIcon, label: "Adds Captions" },
  { Icon: FrameIcon, label: "Auto Reframe (9:16)" },
  { Icon: BoltIcon, label: "Creates 3–4 Clips" },
];

const STEPS = [
  { Icon: UploadIcon, title: "Upload", body: "Add your long video" },
  { Icon: SparkIcon, title: "AI Processes", body: "Finds highlights, adds captions & reframes the speaker" },
  { Icon: LayersIcon, title: "Get Clips", body: "Download 3–4 short, ready-to-post clips" },
];

export default function CreateClipsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
      <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3.5 py-1.5 text-sm font-medium text-zinc-700">
        🎬 AI Video Clipper
      </span>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
        Turn Long Videos into{" "}
        <span className="relative whitespace-nowrap text-violet-600">
          Viral Clips
          <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden>
            <path d="M3 7 Q100 1 197 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-500">
        Upload a video, and AI will find the best moments, add captions, reframe the speaker,
        and create 3–4 ready-to-post clips — all on your own computer.
      </p>

      <div className="mt-9"><UploadCard /></div>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FEATURES.map(({ Icon, label }) => (
          <li key={label} className="flex items-center justify-center gap-2.5 rounded-full bg-violet-50/70 px-4 py-3 text-[15px] font-medium text-zinc-800">
            <Icon className="text-violet-600" /> {label}
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl font-bold tracking-tight text-zinc-900">How It Works</h2>
      <ol className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {STEPS.map(({ Icon, title, body }, i) => (
          <li key={title} className="contents">
            <div className="flex items-start gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500 text-sm font-semibold text-white">{i + 1}</span>
              <Icon width={30} height={30} className="shrink-0 text-violet-600" />
              <div>
                <div className="font-semibold text-zinc-900">{title}</div>
                <div className="mt-0.5 text-sm text-zinc-500">{body}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && <ArrowRightIcon className="hidden text-violet-300 md:block" />}
          </li>
        ))}
      </ol>
    </div>
  );
}
