"""
FastAPI Backend for Voice Call Agent
Provides WebSocket endpoint for real-time communication
"""
import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from agent import VoiceAgent

# Load environment variables
load_dotenv()

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
            "content": "Hello! I'm a voice assistant for NovaTech Solutions. How can I help you today?"
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
                
                # Send response
                await websocket.send_json({
                    "type": "response",
                    "content": response
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
