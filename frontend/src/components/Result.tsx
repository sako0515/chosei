import type { ReactNode } from "react";
import { MicIcon } from "./icons";

export type AnalysisResult = {
  text: string;
  sentiment: Record<string, number>;
};

type Props = { result: AnalysisResult; onRetry: () => void };

const toScore = (value: number) => Math.round(value * 100);

function energyLabel(score: number) {
  if (score < 34) return "おだやかな声";
  if (score < 67) return "ほどよく元気な声";
  return "はつらつとした声";
}

export function Result({ result, onRetry }: Props) {
  const items = Object.entries(result.sentiment)
    .map(([name, value]) => ({ name, score: toScore(value) }))
    .sort((a, b) => b.score - a.score);
  const top = items.slice(0, 3);
  const energy = result.sentiment["エネルギー"];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-aqua">
            <span className="h-px w-6 bg-aqua" />
            TODAY&apos;S CONDITION
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-widest sm:text-4xl">
            今日の声のコンディション
          </h1>
          <p className="mt-3 text-sm tracking-wider text-mist">
            {top.length > 0
              ? `いちばん強く表れていたのは「${top[0].name}」です。`
              : "声の特徴を読み取れませんでした。もう一度お試しください。"}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-aqua/50 bg-white px-6 py-2.5 text-xs tracking-wider text-mist transition hover:bg-aqua-soft"
        >
          <MicIcon className="size-4 text-aqua" />
          もう一度測る
        </button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {energy !== undefined && (
          <Card title="声のエネルギー">
            <div className="flex flex-wrap items-center gap-8">
              <Ring score={toScore(energy)} />
              <span className="rounded-full bg-aqua-soft px-4 py-1.5 text-xs font-semibold text-aqua">
                {energyLabel(toScore(energy))}
              </span>
            </div>
          </Card>
        )}

        <Card title="声から感じる気分">
          {top.length > 0 && (
            <p className="mb-5 font-serif text-2xl font-semibold tracking-widest">
              {top[0].name}
            </p>
          )}
          <div className="space-y-4">
            {top.map((item) => (
              <Meter key={item.name} {...item} />
            ))}
          </div>
        </Card>

        <Card title="すべての指標" className="md:col-span-2">
          <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {items.map((item) => (
              <Meter key={item.name} {...item} />
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-6 rounded-2xl border border-blush/30 bg-linear-to-r from-blush-soft to-white p-6 md:col-span-2">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-blush">
            ✦
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-blush">
              YOUR WORDS
            </p>
            <p className="mt-1 font-serif text-lg font-semibold tracking-wider">
              「{result.text || "(聞き取れませんでした)"}」
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_10px_40px_-20px] shadow-aqua/30 ${className}`}
    >
      <h2 className="mb-6 text-xs font-semibold tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function Meter({ name, score }: { name: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-mist">
        <span>{name}</span>
        <span className="font-semibold text-ink">{score}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-linear-to-r from-aqua to-blush"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function Ring({ score }: { score: number }) {
  const r = 60;
  const length = 2 * Math.PI * r;
  return (
    <div className="relative size-36">
      <svg viewBox="0 0 140 140" className="size-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="9"
          className="stroke-blush-soft"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - score / 100)}
          className="stroke-aqua"
        />
      </svg>
      <p className="absolute inset-0 grid place-items-center font-serif text-4xl font-semibold">
        <span>
          {score}
          <span className="text-xs font-normal text-mist"> / 100</span>
        </span>
      </p>
    </div>
  );
}
