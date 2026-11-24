import os
import tempfile

from fastapi import FastAPI, UploadFile

from main import analyze_amivoice, analyze_formant

app = FastAPI()

@app.post('/api/analyze')
def analyze(audio: UploadFile):
    # 分析する関数がファイルパスを受け取るため、一時ファイルに書き出す。
    # Windows では開いたままのファイルを別の処理から開けないので delete=False にして自分で消す。
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        tmp.write(audio.file.read())

    try:
        f1, f2 = analyze_formant(tmp.name)
        amivoice = analyze_amivoice(tmp.name)
    finally:
        os.remove(tmp.name)  # 録音した音声は保存しない

    return {'f1': f1, 'f2': f2, **amivoice}
