import parselmouth
import numpy

audio_path = 'test.wav'

def analyze_formant(audio_path: str):
    snd = parselmouth.Sound(audio_path)
    formant = snd.to_formant_burg()
    duration = snd.get_total_duration()
    times = numpy.arange(0, duration, 0.01)

    f1_values = []
    f2_values = []
    for t in times:
        f1 = formant.get_value_at_time(1, float(t))
        f2 = formant.get_value_at_time(2, float(t))
        f1_values.append(f1)
        f2_values.append(f2)

    return float(numpy.nanmean(f1_values)), float(numpy.nanmean(f2_values))