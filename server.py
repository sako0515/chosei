import os
import tempfile

from fastapi import FastAPI, UploadFile

from main import analyze_amivoice

app = FastAPI()

@app.post('/api/analyze')
def analyze(audio: UploadFile):
    # 音声形式は AmiVoice がファイルのヘッダーから自動で判別するので、拡張子は付けない
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(audio.file.read())

    try:
        return analyze_amivoice(tmp.name)
    finally:
        os.remove(tmp.name)  # 録音した音声は保存しない
