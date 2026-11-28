import { MicIcon } from "./icons";

export function Analyzing() {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-white/60 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border border-aqua/20 bg-white px-10 py-8 text-center shadow-[0_20px_60px_-20px] shadow-aqua/40">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-aqua-soft">
          <div className="grid size-16 animate-pulse place-items-center rounded-full border border-aqua/40 bg-white">
            <MicIcon className="size-6 text-aqua" />
          </div>
        </div>
        <p className="mt-4 font-serif text-lg font-semibold tracking-wider">
          声の響きを読み取っています
        </p>
        <p className="mt-3 text-xs tracking-wider text-mist">
          感情・エネルギー・話し方を確認中…
        </p>
        <div className="mt-6 h-0.5 overflow-hidden rounded-full bg-aqua-soft">
          <div className="h-full w-1/3 animate-slide rounded-full bg-aqua" />
        </div>
      </div>
    </div>
  );
}
