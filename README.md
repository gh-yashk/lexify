# Lexify – Turn YouTube Videos into Markdown Notes

**Lexify** is a smart tool that converts English audio from YouTube videos into clean, structured notes in Markdown format.

---

## Why the Name *Lexify*?

The name *Lexify* comes from the Latin root **"lex"**, meaning **"word"** or **"law"**. The suffix **"-ify"** implies transformation. Together, *Lexify* suggests "turning words into something structured" — exactly what the tool does by converting speech into readable notes.

---

## Why Use Lexify?

Watching long YouTube videos for information can be time-consuming. **Lexify** helps by:
* Extracting key insights from video content
* Turning speech into structured, readable notes
* Saving hours of manual summarization

Perfect for:
* Lecture recaps
* Content reviews
* Self-paced learning

---

## How It Works

1. **Input a YouTube video URL**
2. **Audio is extracted** using `yt-dlp`
3. **English transcription** is performed using `Whisper`
4. **Transcript is summarized** into Markdown notes by `Llama 3.1 8B` via `Ollama`
5. **Clean, structured notes** are returned in `.md` format

> Currently supports English audio only.

---

## Tech Stack

| Tool              | Purpose                                      |
| ----------------- | -------------------------------------------- |
| **FastAPI**       | Web API backend                              |
| **yt-dlp**        | Downloading YouTube video & extracting audio |
| **FFmpeg**        | Audio processing and format conversion       |
| **Whisper**       | Transcribing spoken English to text          |
| **Ollama**        | Serving local LLMs                           |
| **Llama 3.1 8B**  | Generating structured notes from transcripts |

---

## Project Structure

```
lexify/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   └── youtube.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llama_service.py
│   │   ├── whisper_service.py
│   │   ├── youtube_notes_service.py
│   │   └── yt_dlp_service.py
│   ├── static/
│   │   ├── script.js
│   │   └── styles.css
│   ├── template/
│   │   └── index.html
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── file_utils.py
│   │   ├── logger_setup.py
│   │   └── prompt_generator.py
│   ├── __init__.py
│   └── main.py
├── requirements.txt
└── README.md
```

---

## Getting Started

Follow these steps to set up and run **Lexify** locally:

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/gh-yashk/lexify.git
cd lexify/
```

---

### 2. Set Up Python Environment

> Requires **Python 3.10**

```bash
# Create and activate virtual environment
python3.10 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

---

### 3. Start Ollama + Llama 3.1 8B with Docker

> This runs **Ollama** locally with the **Llama 3.1 8B** model.

```bash
# Start Ollama container
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Download and run Llama 3.1 model
docker exec ollama ollama run llama3.1:latest

# Verify the model is running
docker exec ollama ollama ps
```

**Test the Ollama API:**
```bash
# Test API connection with a simple prompt
curl -X POST http://localhost:11434/api/generate -d '{
    "model": "llama3.1:latest",
    "prompt": "Write a haiku about the ocean.",
    "stream": false
}'
```

---

### 4. Run the FastAPI App

Start the server:

```bash
# Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit `http://0.0.0.0:8000/`

---

## Requirements

* **Python 3.10**
* **Docker** (for Ollama)
* **FFmpeg** (for audio processing)
* **16GB RAM** (recommended)

---
