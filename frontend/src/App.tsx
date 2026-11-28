import { useRef, useState } from "react";
import { Analyzing } from "./components/Analyzing";
import { Home } from "./components/Home";
import { Logo } from "./components/icons";
import { Result, type AnalysisResult } from "./components/Result";

const RECORDING_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus"];

type Phase = "idle" | "recording" | "analyzing";

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [measuredAt, setMeasuredAt] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);

  async function startRecording() {
    setError(null);
    const mimeType = RECORDING_TYPES.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    if (!mimeType) {
      setError(
        "このブラウザの録音形式には対応していません。Chrome か Firefox をお使いください",
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "マイクを使えませんでした。ブラウザのマイクの許可を確認してください",
      );
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      analyze(new Blob(chunks, { type: recorder.mimeType }));
    };

    recorder.start();
    recorderRef.current = recorder;
    setPhase("recording");
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  async function analyze(recorded: Blob) {
    setPhase("analyzing");
    try {
      const form = new FormData();
      form.append("audio", recorded);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error(`分析に失敗しました (${res.status})`);
      setResult(await res.json());
      setMeasuredAt(
        new Date().toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPhase("idle");
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-40 -left-40 size-150 rounded-full bg-aqua/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 size-150 rounded-full bg-blush/10 blur-3xl" />
      </div>

      <header className="flex h-20 items-center justify-between px-6 sm:px-16">
        <Logo />
        {result && (
          <div className="flex items-center gap-4 text-xs tracking-wider text-mist">
            <span>{measuredAt}</span>
            <span className="rounded-full bg-blush-soft px-3 py-1 text-blush">
              今日の記録
            </span>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col">
        {result ? (
          <Result result={result} onRetry={() => setResult(null)} />
        ) : (
          <Home
            recording={phase === "recording"}
            error={error}
            onStart={startRecording}
            onStop={stopRecording}
          />
        )}
      </main>

      <footer className="px-6 py-6 text-[10px] tracking-wider text-mist sm:px-16">
        声の特徴をもとにした参考情報です。医療的な診断ではありません。
      </footer>

      {phase === "analyzing" && <Analyzing />}
    </div>
  );
}
