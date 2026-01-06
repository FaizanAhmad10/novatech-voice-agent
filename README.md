# Voice Call Agent

A full-stack voice-enabled AI assistant built with **LangChain + Groq** backend and **React** frontend.

## Features

- 🎤 **Voice Input** - Speech-to-Text using Web Speech API
- 🔊 **Voice Output** - Text-to-Speech for assistant responses
- 💬 **Real-time Chat** - WebSocket communication for instant responses
- 🤖 **AI Agent** - LangChain agent with Groq LLM (llama-3.1-70b)
- 🎨 **Modern UI** - Premium dark theme with glassmorphism effects

## Prerequisites

- Python 3.9+
- Node.js 20.19+ or 22.12+
- Groq API Key (get from https://console.groq.com/)

## Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
python main.py
```
Server runs at http://localhost:8000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
App runs at http://localhost:5173

## Usage

1. Open http://localhost:5173 in Chrome or Edge (best Web Speech API support)
2. Click **Connect** to establish WebSocket connection
3. Click the **microphone button** to start voice input
4. Speak your query
5. The assistant will respond in text and voice

## Project Structure

```
voice call agent/
├── backend/
│   ├── main.py           # FastAPI server with WebSocket
│   ├── agent.py          # LangChain agent with Groq
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment template
│
└── frontend/
    ├── src/
    │   ├── App.jsx       # Main React component
    │   ├── App.css       # Component styles
    │   ├── hooks/
    │   │   ├── useWebSocket.js  # WebSocket hook
    │   │   └── useSpeech.js     # STT/TTS hooks
    │   └── ...
    └── ...
```

## Troubleshooting

- **Microphone not working**: Ensure browser has microphone permissions
- **Voice not recognized**: Use Chrome or Edge for best Web Speech API support
- **Backend connection failed**: Check if Python server is running on port 8000
