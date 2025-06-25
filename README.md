# 📘 Lexify – Turn YouTube Videos into Markdown Notes

**Lexify** is a smart tool that converts English audio from YouTube videos into clean, structured notes in Markdown format.

---

## ❓ Why the Name *Lexify*?

The name *Lexify* comes from the Latin root **"lex"**, meaning **"word"** or **"law"**. The suffix **"-ify"** implies transformation. Together, *Lexify* suggests “turning words into something structured” — exactly what the tool does by converting speech into readable notes.

---

## 🔍 Why Use Lexify?

Watching long YouTube videos for information can be time-consuming. **Lexify** helps by:
* Extracting key insights from video content
* Turning speech into structured, readable notes
* Saving hours of manual summarization

Perfect for:
* Lecture recaps
* Content reviews
* Self-paced learning

---

## ⚙️ How It Works

1. **Input a YouTube video URL**
2. **Audio is extracted** using `yt-dlp`
3. **English transcription** is performed using `Whisper`
4. **Transcript is summarized** into Markdown notes by `Mistral 7B` via `Ollama`
5. **Clean, structured notes** are returned in `.md` format

> 💬 *Currently supports English audio only.*

---

## 🧰 Tech Stack

| Tool           | Purpose                                      |
| -------------- | -------------------------------------------- |
| **FastAPI**    | Web API backend                              |
| **yt-dlp**     | Downloading YouTube video & extracting audio |
| **Whisper**    | Transcribing spoken English to text          |
| **Ollama**     | Serving local LLMs like Mistral              |
| **Mistral 7B** | Generating structured notes from transcripts |

---

## 🗂️ Project Structure

```
project-root/
├── app/
│   ├── models/
│   │   └── youtube.py
│   ├── services/
│   │   ├── mistral_service.py
│   │   ├── whisper_service.py
│   │   ├── youtube_notes_service.py
│   │   └── yt_dlp_service.py
│   ├── utils/
│   │   ├── file_utils.py
│   │   ├── logger_setup.py
│   │   └── prompt_generator.py
│   └── main.py
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to set up and run **Lexify** locally:

### 1. 🔁 Clone the Repository

```bash
git clone https://github.com/gh-yashk/lexify.git
cd lexify
```

---

### 2. 🐍 Set Up Python Environment

> Requires **Python 3.10**

```bash
# Create virtual environment
py -3.10 -m venv .venv

# Activate it
.\.venv\Scripts\activate       # Windows
# or
source .venv/bin/activate      # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

---

### 3. 🐳 Start Ollama + Mistral with Docker

> This runs **Ollama** locally with the **Mistral 7B** model.

```bash
docker-compose up -d
```

Make sure Docker is installed and running.
Ollama will be available at: `http://localhost:11434`

---

### 4. 🚦 Run the FastAPI App

Start the API server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit the FastAPI docs at:
👉 `http://localhost:8000/docs`

---
