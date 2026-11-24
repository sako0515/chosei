import { useRef, useState } from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { toWav } from './wav'

type Result = {
  f1: number | null
  f2: number | null
  text: string
  sentiment: Record<string, number> // 日本語名 -> 0〜1に正規化した値
}

type Phase = 'idle' | 'recording' | 'analyzing'

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  async function startRecording() {
    setError(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop()) // マイクを解放する
      analyze(new Blob(chunks, { type: recorder.mimeType }))
    }

    recorder.start()
    recorderRef.current = recorder
    setPhase('recording')
  }

  function stopRecording() {
    recorderRef.current?.stop() // 録音が終わると onstop が呼ばれる
  }

  async function analyze(recorded: Blob) {
    setPhase('analyzing')
    try {
      const form = new FormData()
      form.append('audio', await toWav(recorded), 'voice.wav')
      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      if (!res.ok) throw new Error(`分析に失敗しました (${res.status})`)
      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPhase('idle')
    }
  }

  // Recharts は配列形式のデータを受け取るので変換する
  const chartData = result
    ? Object.entries(result.sentiment).map(([name, value]) => ({ name, value }))
    : []

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">調声</h1>

      {phase === 'idle' && (
        <button onClick={startRecording} className="my-4 rounded bg-sky-400 px-4 py-2 text-white">
          録音開始
        </button>
      )}
      {phase === 'recording' && (
        <button onClick={stopRecording} className="my-4 rounded bg-pink-400 px-4 py-2 text-white">
          録音停止して分析
        </button>
      )}
      {phase === 'analyzing' && <p className="my-4">分析中…</p>}

      {error && <p className="my-2 text-red-500">{error}</p>}

      {result && (
        <>
          <p>F1: {result.f1?.toFixed(1)} Hz / F2: {result.f2?.toFixed(1)} Hz</p>
          <p className="my-2">文字起こし: {result.text}</p>
          <BarChart width={700} height={500} data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 1]} />
            <YAxis type="category" dataKey="name" width={120} />
            <Bar dataKey="value" fill="#7dd3fc" />
          </BarChart>
        </>
      )}
    </main>
  )
}
