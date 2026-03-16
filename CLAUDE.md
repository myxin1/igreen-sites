# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Application

```bash
python transcrever.py
```

## Dependencies

No `requirements.txt` exists. Install manually:

```bash
pip install sounddevice scipy openai-whisper
```

## Architecture

Single-file Python CLI application (`transcrever.py`) for Portuguese audio transcription:

- `gravar(segundos)` — Records audio from the microphone via `sounddevice`, returns a numpy array
- `transcrever(audio)` — Writes audio to a temp WAV file, runs Whisper, deletes the temp file, returns transcribed text
- Main block — CLI loop: prompts for duration, records, transcribes, optionally appends to `transcricao.txt`

**Key constants at top of file:**
- `SAMPLE_RATE = 16000` — required by Whisper
- `MODEL = "base"` — can be changed to `"small"` or `"medium"` for better accuracy at the cost of speed

## GitHub Repository

Repository: https://github.com/myxin1/transcricao-audio

**After every change to the project, push to GitHub:**

```bash
cd "c:/Users/User/Downloads/Projeto Claude Code"
git add -A
git commit -m "descrição da alteração"
git push origin main
```

Claude Code must run these commands automatically after every modification to keep the repository up to date. No manual intervention needed from the user.
