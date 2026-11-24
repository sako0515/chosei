// ブラウザで録音した音声(WebMなど)を、16kHz・モノラル・16bit PCM の WAV に変換する。
// WAV にするのは、フォルマント分析(Praat)がWebMを読めないため。
// 16kHz にするのは、AmiVoice が16kHzより高いレートを16kHzに下げて処理するため。

const SAMPLE_RATE = 16000

export async function toWav(blob: Blob): Promise<Blob> {
  // 1. 録音データを音声波形(AudioBuffer)に戻す
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  await ctx.close()

  // 2. 16kHz・1チャンネルで描き直す(リサンプリング。ステレオは自動で平均される)
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * SAMPLE_RATE), SAMPLE_RATE)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()

  // 3. WAV ファイルの形にする
  return encodeWav(rendered.getChannelData(0))
}

// WAV = 44バイトのヘッダー + 16bit整数の波形データ
function encodeWav(samples: Float32Array): Blob {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2))
  const writeText = (offset: number, text: string) =>
    [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))

  writeText(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true) // 以降のファイルサイズ
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt チャンクのサイズ
  view.setUint16(20, 1, true) // 形式: PCM
  view.setUint16(22, 1, true) // チャンネル数: 1
  view.setUint32(24, SAMPLE_RATE, true) // サンプリングレート
  view.setUint32(28, SAMPLE_RATE * 2, true) // 1秒あたりのバイト数
  view.setUint16(32, 2, true) // 1サンプルのバイト数
  view.setUint16(34, 16, true) // ビット数
  writeText(36, 'data')
  view.setUint32(40, samples.length * 2, true) // 波形データのサイズ

  // -1〜1 の小数を、-32768〜32767 の整数に変換して書き込む
  samples.forEach((s, i) => {
    const v = Math.max(-1, Math.min(1, s))
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true)
  })

  return new Blob([view], { type: 'audio/wav' })
}
