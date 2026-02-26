import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Mic, MicOff, Send, Volume2, Bot, User } from 'lucide-react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  const wsRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Setup WebSocket connection
  useEffect(() => {
    const clientId = Math.random().toString(36).substring(7)
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${clientId}`)

    ws.onopen = () => {
      console.log('Connected to WebSocket')
      setIsConnected(true)
    }

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'response' || data.type === 'connected') {
        setMessages(prev => [...prev, { text: data.content, isAgent: true, audio: data.audio }])
        // Automatically play TTS if provided in the WebSocket message
        if (data.audio) {
          playAudioBase64(data.audio)
        }
      } else if (data.type === 'typing') {
        // Could visually represent typing here
      } else if (data.type === 'error') {
        console.error("Backend error:", data.content)
        setMessages(prev => [...prev, { text: `Error: ${data.content}`, isAgent: true }])
      }
    }

    ws.onclose = () => {
      console.log('Disconnected from WebSocket')
      setIsConnected(false)
    }

    wsRef.current = ws

    return () => {
      if (ws) ws.close()
    }
  }, [])

  // Setup global audio element
  useEffect(() => {
    const globalAudio = new Audio()
    globalAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    window.globalAgentAudio = globalAudio
  }, [])

  // Handle Base64 Audio Playback locally
  const playAudioBase64 = (audioBase64) => {
    if (!audioBase64) return
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`

    if (window.globalAgentAudio) {
      window.globalAgentAudio.src = audioUrl
      window.globalAgentAudio.play().catch(e => console.error("Autoplay blocked:", e))
    } else {
      const audio = new Audio(audioUrl)
      audio.play().catch(e => console.error("Autoplay blocked:", e))
    }
  }

  // Handle Text Input Submission
  const handleSubmitText = (e) => {
    e.preventDefault()

    // Unlock autoplay from user gesture
    if (window.globalAgentAudio && window.globalAgentAudio.paused) {
      window.globalAgentAudio.play().catch(() => { });
    }

    if (!inputText.trim() || !wsRef.current) return

    const userMessage = inputText.trim()
    setMessages(prev => [...prev, { text: userMessage, isAgent: false }])

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: userMessage
    }))

    setInputText('')
  }

  // Handle Recording Start/Stop
  const toggleRecording = async () => {
    // If the agent is currently speaking, stop it
    if (window.globalAgentAudio && !window.globalAgentAudio.paused) {
      window.globalAgentAudio.pause();
      window.globalAgentAudio.currentTime = 0;
    }
    // Quickly touch play then pause to satisfy user gesture requirement without actually making noise
    else if (window.globalAgentAudio) {
      window.globalAgentAudio.play().then(() => {
        window.globalAgentAudio.pause();
        window.globalAgentAudio.currentTime = 0;
      }).catch(() => { });
    }

    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          audioChunksRef.current = [] // reset

          // Send to STT
          await processAudio(audioBlob)

          // Stop all mic tracks
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Please allow microphone access to use voice features.')
      }
    }
  }

  // Handle STT Processing
  const processAudio = async (audioBlob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await axios.post('http://127.0.0.1:8000/api/stt', formData)

      if (response.data && response.data.text) {
        const transcribedText = response.data.text.trim()
        if (transcribedText) {
          // Display the recognized text
          setMessages(prev => [...prev, { text: transcribedText, isAgent: false }])

          // Send recognized text to WebSocket for LLM processing
          if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
              type: 'message',
              content: transcribedText
            }))
          }
        }
      }
    } catch (error) {
      console.error('STT Error:', error)
      setMessages(prev => [...prev, { text: 'Sorry, could not process audio.', isAgent: true }])
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Technova Voice Agent</h1>
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="chat-container">
        <div className="messages-area">
          {messages.map((message, index) => (
            <div key={index} className={`message-wrapper ${message.isAgent ? 'agent' : 'user'}`}>
              <div className="message-avatar">
                {message.isAgent ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-bubble">
                <p>{message.text}</p>
                {message.isAgent && message.audio && (
                  <button className="play-btn" onClick={() => playAudioBase64(message.audio)} title="Play Audio">
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Invisible element to scroll to bottom could go here */}
        </div>

        <div className="input-area">
          <button
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <form onSubmit={handleSubmitText} className="text-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={isRecording}
            />
            <button type="submit" disabled={!inputText.trim() || isRecording}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default App
