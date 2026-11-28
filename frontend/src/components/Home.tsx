import { MicIcon } from "./icons";

type Props = {
  recording: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
};

const BARS = Array.from({ length: 28 }, (_, i) => ({
  height: 8 + ((i * 7) % 20),
  delay: `${(i % 7) * -0.15}s`,
  color: i % 3 === 0 ? "bg-blush" : "bg-aqua",
}));

export function Home({ recording, error, onStart, onStop }: Props) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-aqua">
        <span className="h-px w-6 bg-aqua" />
        VOICE CONDITION CHECK
      </p>
      <h1 className="mt-6 font-serif text-5xl font-semibold tracking-widest">
        調声
      </h1>
      <p className="mt-8 text-sm leading-loose tracking-wider text-mist">
        <span className="text-ink">「おはよう」</span>とひとこと話すだけ。
        <br />
        声の響きから、今日のコンディションを確認します。
      </p>

      <div className="mt-10 flex w-full max-w-3xl items-center gap-4 rounded-full border border-aqua/40 bg-white py-3 pr-3 pl-7 text-left shadow-[0_10px_40px_-12px] shadow-aqua/30">
        <MicIcon className="size-5 shrink-0 text-aqua" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wider">
            {recording ? "録音しています" : "声のチェックをはじめる"}
          </p>
          <p className="mt-0.5 text-xs text-mist">
            {recording
              ? "自然な声で話し、終わったら停止ボタンを押してください"
              : "右のボタンを押して録音をはじめます"}
          </p>
        </div>

        {recording && (
          <div className="hidden h-8 items-center gap-0.75 sm:flex" aria-hidden>
            {BARS.map((bar, i) => (
              <span
                key={i}
                className={`w-0.5 animate-wave rounded-full opacity-70 ${bar.color}`}
                style={{ height: bar.height, animationDelay: bar.delay }}
              />
            ))}
          </div>
        )}

        <button
          onClick={recording ? onStop : onStart}
          aria-label={recording ? "録音を停止して分析する" : "録音をはじめる"}
          className={`grid size-14 shrink-0 cursor-pointer place-items-center rounded-full text-white ring-6 transition hover:brightness-105 ${
            recording ? "bg-blush ring-blush-soft" : "bg-aqua ring-aqua-soft"
          }`}
        >
          {recording ? (
            <span className="size-4 rounded-sm bg-white" />
          ) : (
            <MicIcon className="size-6" />
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-5 text-xs text-blush">{error}</p>
      ) : (
        <p className="mt-5 text-xs tracking-wider text-mist">
          録音した音声は保存されません
        </p>
      )}
    </section>
  );
}
