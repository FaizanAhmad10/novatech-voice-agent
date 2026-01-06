# 🎤 NovaTech Solutions - AI Voice Call Agent

An intelligent voice-enabled customer support agent that answers company-specific questions using **Retrieval-Augmented Generation (RAG)**.

![Voice Agent Demo](https://img.shields.io/badge/AI-Voice%20Agent-purple?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![LangChain](https://img.shields.io/badge/LangChain-RAG-green?style=flat-square)

---

## 🚀 Overview

This project is a **full-stack AI voice assistant** built for NovaTech Solutions. Users can have natural voice conversations with the agent, which retrieves accurate information from company documents to answer questions.

### ✨ Key Features

- �️ **Voice Input** - Speak naturally using your microphone
- 🔊 **Voice Output** - Responses are read aloud automatically
- 🧠 **RAG-Powered** - Answers extracted from company PDF documents
- 💬 **Real-time Chat** - Instant responses via WebSocket
- 🎯 **Company-Focused** - Only answers NovaTech-related questions
- � **Modern UI** - Premium dark theme with glassmorphism

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python, FastAPI, LangChain, Groq (Llama 3.3 70B) |
| **Frontend** | React 18, Vite, Web Speech API |
| **RAG** | FAISS Vector Store, Sentence Transformers |
| **Communication** | WebSocket (Real-time bidirectional) |

---

## ⚙️ How It Works

```
User Speaks → Speech-to-Text → WebSocket → RAG Search → LLM Response → Text-to-Speech
```

1. **Voice Capture** - Web Speech API transcribes user speech
2. **Document Search** - FAISS finds relevant company information
3. **AI Response** - Groq LLM generates accurate answers using context
4. **Voice Playback** - Browser reads the response aloud

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py          # FastAPI server with WebSocket
│   ├── agent.py         # RAG agent with LangChain
│   └── data/            # PDF documents folder
│
└── frontend/
    ├── src/App.jsx      # Main React component
    └── src/hooks/       # Voice & WebSocket hooks
```

---

## 🎯 Use Cases

- 📞 Automated Customer Support
- 🏢 Company Information Helpdesk
- 📋 Policy & FAQ Assistant
- 🎤 Voice-Enabled Knowledge Base

---

## 🔗 Technologies & Concepts

`RAG` `LangChain` `FAISS` `Vector Embeddings` `WebSocket` `Speech Recognition` `Text-to-Speech` `Conversational AI`

---

## 📄 License

MIT License - Feel free to use and modify!
