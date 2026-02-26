"""
FastAPI Backend for Voice Call Agent
Provides WebSocket endpoint for real-time communication
"""
import os
import json
import uuid
import tempfile
import aiofiles
import base64
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from agent import VoiceAgent
import groq
import edge_tts

# Load environment variables
load_dotenv()

# Initialize Groq client for Whisper
groq_client = groq.AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(
    title="Voice Call Agent API",
    description="A voice-enabled AI assistant powered by LangChain and Groq",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory for temporary audio files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Store active connections and their agents
active_connections: dict[str, tuple[WebSocket, VoiceAgent]] = {}


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "message": "Voice Call Agent API is running"}


@app.get("/health")
async def health_check():
    """Health check for monitoring."""
    return {"status": "healthy"}

@app.post("/api/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech to text using Groq Whisper model."""
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")
        
    temp_file_path = UPLOAD_DIR / f"{uuid.uuid4()}_{audio.filename}"
    
    try:
        # Save temporary uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await audio.read()
            await out_file.write(content)
            
        # Call Groq Whisper API
        with open(temp_file_path, "rb") as file:
            transcription = await groq_client.audio.transcriptions.create(
                file=(audio.filename, file.read()),
                model="whisper-large-v3",
                prompt="Specify context or spelling",
                response_format="json",
                language="en",
                temperature=0.0
            )

        print(f"Transcription: {transcription.text}")
        return {"text": transcription.text}
        
    except Exception as e:
        print(f"STT Error: {e}")
        raise HTTPException(status_code=500, detail=f"Speech to text failed: {str(e)}")
        
    finally:
        # Cleanup
        if temp_file_path.exists():
            os.remove(temp_file_path)

@app.post("/api/tts")
async def text_to_speech(text: str = Form(...)):
    """Convert text to speech using edge-tts."""
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
        
    output_filename = f"{uuid.uuid4()}.mp3"
    output_path = UPLOAD_DIR / output_filename
    
    try:
        # Use a good English voice
        voice = "en-US-AriaNeural"
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(output_path))
        
        return FileResponse(
            path=output_path, 
            media_type="audio/mpeg", 
            filename="response.mp3"
        )
        
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=f"Text to speech failed: {str(e)}")


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time voice communication.
    
    Message format (client -> server):
    {
        "type": "message",
        "content": "transcribed text from user"
    }
    
    Message format (server -> client):
    {
        "type": "response",
        "content": "agent's response text"
    }
    """
    await websocket.accept()
    
    # Create a new agent instance for this connection
    agent = VoiceAgent()
    active_connections[client_id] = (websocket, agent)
    
    print(f"Client {client_id} connected. Active connections: {len(active_connections)}")
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "content": "Hello! I'm a voice assistant for Technova Solutions. How can I help you today?"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "message":
                user_text = message.get("content", "")
                print(f"[{client_id}] User: {user_text}")
                
                # Send typing indicator
                await websocket.send_json({
                    "type": "typing",
                    "content": True
                })
                
                # Process with agent
                response = await agent.process_message(user_text)
                print(f"[{client_id}] Agent: {response}")
                
                # Run TTS in backend
                voice = "en-US-AriaNeural"
                communicate = edge_tts.Communicate(response, voice)
                audio_data = bytearray()
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_data.extend(chunk["data"])
                
                audio_base64 = base64.b64encode(audio_data).decode("utf-8")
                
                # Send text and audio together
                await websocket.send_json({
                    "type": "response",
                    "content": response,
                    "audio": audio_base64
                })
            
            elif message.get("type") == "clear_history":
                agent.clear_memory()
                await websocket.send_json({
                    "type": "cleared",
                    "content": "Conversation history cleared."
                })
                
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"Error with client {client_id}: {e}")
        await websocket.send_json({
            "type": "error",
            "content": str(e)
        })
    finally:
        if client_id in active_connections:
            del active_connections[client_id]


if __name__ == "__main__":
    import uvicorn
    print("Starting Voice Call Agent Backend...")
    print("WebSocket endpoint: ws://localhost:8000/ws/{client_id}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
