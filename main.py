from dotenv import load_dotenv
import os
import sys
import time
import requests

load_dotenv()
AUDIO_FILE = 'test.wav'
AMIVOICE_URL = 'https://acp-api-async.amivoice.com/v2/recognitions'

SENTIMENT_PARAMETERS = {
    'energy': ('エネルギー', 0, 100),
    'stress': ('ストレス', 0, 100),
    'emo_cog': ('感情バランス論理', 1, 500),
    'concentration': ('集中', 0, 100),
    'anticipation': ('期待', 0, 100),
    'excitement': ('興奮', 0, 30),
    'hesitation': ('躊躇', 0, 30),
    'uncertainty': ('不確実', 0, 30),
    'intensive_thinking': ('思考', 0, 100),
    'imagination_activity': ('想像力', 0, 30),
    'embarrassment': ('困惑', 0, 30),
    'passionate': ('情熱', 0, 30),
    'brain_power': ('脳活動', 0, 100),
    'confidence': ('自信', 0, 30),
    'aggression': ('攻撃性憤り', 0, 30),
    'atmosphere': ('雰囲気会話傾向', -100, 100),
    'upset': ('動揺', 0, 30),
    'content': ('喜び', 0, 30),
    'dissatisfaction': ('不満', 0, 30),
    'extreme_emotion': ('極端な起伏', 0, 30),
}


def analyze_amivoice(audio_path: str, timeout_sec: int = 300, interval_sec: int = 5) -> dict:
    api_key = os.environ.get('AMIVOICE_APIKEY')
    if not api_key:
        raise RuntimeError('環境変数 AMIVOICE_APIKEY が設定されていません(.envを確認してください)')
    headers = {'Authorization': f'Bearer {api_key}'}

    with open(audio_path, 'rb') as f:
        res = requests.post(
            AMIVOICE_URL,
            headers=headers,
            data={'d': 'grammarFileNames=-a-general sentimentAnalysis=True loggingOptOut=True'},
            files={'a': f},
            timeout=60,
        )
    res.raise_for_status()
    body = res.json()
    session_id = body.get('sessionid')
    if not session_id:
        raise RuntimeError(f"AmiVoiceのジョブ登録に失敗しました [{body.get('code')}] {body.get('message')}")

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        res = requests.get(f'{AMIVOICE_URL}/{session_id}', headers=headers, timeout=30)
        res.raise_for_status()
        data = res.json()
        status = data.get('status')
        if status == 'completed':
            return _parse_amivoice_result(data)
        if status == 'error':
            raise RuntimeError(f"AmiVoiceの認識でエラーが発生しました: {data.get('error_message')}")
        time.sleep(interval_sec)

    raise TimeoutError('AmiVoiceの結果取得がタイムアウトしました')


def _parse_amivoice_result(data: dict) -> dict:
    sentiment = data.get('sentiment_analysis') or {}
    segments = sentiment.get('segments', [])

    sums, counts = {}, {}
    for seg in segments:
        for key, value in seg.items():
            if key in ('starttime', 'endtime') or not isinstance(value, (int, float)):
                continue
            sums[key] = sums.get(key, 0) + value
            counts[key] = counts.get(key, 0) + 1

    raw, normalized = {}, {}
    for key in sums:
        if key not in SENTIMENT_PARAMETERS:
            continue
        label, minimum, maximum = SENTIMENT_PARAMETERS[key]
        mean = sums[key] / counts[key]
        raw[label] = mean
        normalized[label] = min(1.0, max(0.0, (mean - minimum) / (maximum - minimum)))

    return {
        'text': data.get('text', ''),
        'sentiment': normalized,
        'sentiment_raw': raw,
    }


def main():
    audio_path = sys.argv[1] if len(sys.argv) > 1 else AUDIO_FILE

    result = analyze_amivoice(audio_path)
    print(f"文字起こし: {result['text']}")
    if not result['sentiment']:
        print('感情分析の結果が空でした(音声が短すぎる、または小さすぎる可能性があります)。')
    for name, value in result['sentiment'].items():
        print(f"  {name}: {value:.2f}  (元の値: {result['sentiment_raw'][name]:.1f})")


if __name__ == '__main__':
    main()
