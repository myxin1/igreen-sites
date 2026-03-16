import sounddevice as sd
from scipy.io.wavfile import write
import whisper
import tempfile
import os

# Configurações
SAMPLE_RATE = 16000  # Whisper usa 16kHz
MODEL = "base"       # Troque por "small" ou "medium" para mais precisão

def gravar(segundos=5):
    print(f"🎙️  Gravando por {segundos} segundos... Fale agora!")
    audio = sd.rec(int(segundos * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
    sd.wait()
    print("✅ Gravação concluída.")
    return audio

def transcrever(audio):
    print("⏳ Transcrevendo...")
    model = whisper.load_model(MODEL)

    # Salva temporariamente em WAV
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp_path = f.name
        write(tmp_path, SAMPLE_RATE, audio)

    result = model.transcribe(tmp_path, language="pt")
    os.unlink(tmp_path)
    return result["text"]

if __name__ == "__main__":
    try:
        segundos = input("Quantos segundos deseja gravar? (padrão: 5): ").strip()
        segundos = int(segundos) if segundos else 5

        audio = gravar(segundos)
        texto = transcrever(audio)

        print("\n📝 Transcrição:")
        print(texto)

        # Salvar em arquivo
        salvar = input("\nDeseja salvar a transcrição em arquivo? (s/n): ").strip().lower()
        if salvar == "s":
            with open("transcricao.txt", "a", encoding="utf-8") as f:
                f.write(texto + "\n")
            print("✅ Salvo em transcricao.txt")

    except KeyboardInterrupt:
        print("\nEncerrado.")
