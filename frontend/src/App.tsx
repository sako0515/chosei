import { useRef, useState } from 'react'
import { AudioLines, Loader2, Mic, Moon, Square, Sun } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/hooks/use-theme'

// AmiVoice がそのまま受け付ける録音形式(Safari 既定の MP4 は非対応)
const RECORDING_TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus']

type Result = {
  text: string
  sentiment: Record<string, number> // 日本語名 -> 0〜1に正規化した値
}

type Phase = 'idle' | 'recording' | 'analyzing'

const STATUS: Record<Phase, { title: string; description: string }> = {
  idle: { title: '声のチェックをはじめる', description: '右のマイクボタンを押してください' },
  recording: { title: '録音中…', description: '話し終えたら停止ボタンを押してください' },
  analyzing: { title: '分析中…', description: 'しばらくお待ちください' },
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  async function startRecording() {
    setError(null)
    const mimeType = RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
    if (!mimeType) {
      setError('このブラウザの録音形式には対応していません。Chrome か Firefox をお使いください')
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType })
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
      form.append('audio', recorded)
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
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-bold">
            <AudioLines className="size-5" aria-hidden />
            調声
          </span>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="テーマを切り替える">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-8 px-4 py-16">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-widest">調声</h1>
          <p className="text-muted-foreground">
            「おはよう」とひとこと。声から、今日の自分を見つめてみませんか。
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{STATUS[phase].title}</p>
              <p className="text-sm text-muted-foreground">{STATUS[phase].description}</p>
            </div>
            {phase === 'idle' && (
              <Button size="icon" onClick={startRecording} aria-label="録音開始">
                <Mic />
              </Button>
            )}
            {phase === 'recording' && (
              <Button size="icon" variant="destructive" onClick={stopRecording} aria-label="録音停止">
                <Square />
              </Button>
            )}
            {phase === 'analyzing' && (
              <Button size="icon" disabled aria-label="分析中">
                <Loader2 className="animate-spin" />
              </Button>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>分析結果</CardTitle>
              <CardDescription>文字起こし: {result.text}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={chartData.length * 32 + 40}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 1]} stroke="var(--muted-foreground)" />
                  <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" />
                  <Bar dataKey="value" fill="var(--foreground)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
