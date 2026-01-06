import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useSpeechToText, useTextToSpeech } from './hooks/useSpeech';
import './App.css';

// Generate unique client ID
const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Use environment variable for backend URL (falls back to localhost for development)
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const WS_URL = `${WS_BASE_URL}/ws/${clientId}`;

function App() {
  const [textInput, setTextInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef(null);
  const lastSpokenRef = useRef(null);

  // WebSocket connection
  const {
    isConnected,
    messages,
    isTyping,
    connect,
    disconnect,
    sendMessage,
    clearHistory
  } = useWebSocket(WS_URL);

  // Speech hooks
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: sttSupported,
    startListening,
    stopListening
  } = useSpeechToText();

  const {
    isSpeaking,
    isSupported: ttsSupported,
    speak,
    stop: stopSpeaking
  } = useTextToSpeech();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send transcript when speech recognition completes
  useEffect(() => {
    if (transcript && !isListening) {
      sendMessage(transcript);
    }
  }, [transcript, isListening, sendMessage]);

  // Auto-speak assistant responses
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content !== lastSpokenRef.current) {
        lastSpokenRef.current = lastMessage.content;
        speak(lastMessage.content);
      }
    }
  }, [messages, autoSpeak, speak]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleVoiceButton = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
    }
  };

  return (
    <div className="app">
      {/* Background effects */}
      <div className="bg-gradient"></div>
      <div className="bg-glow"></div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <h1>NovaTech Solutions</h1>
          </div>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Chat Messages */}
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🏢'}
                </div>
                <div className="message-content">
                  <span className="message-role">
                    {msg.role === 'user' ? 'You' : 'NovaTech'}
                  </span>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">🏢</div>
                <div className="message-content">
                  <span className="message-role">NovaTech</span>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Transcript */}
          {(isListening || interimTranscript) && (
            <div className="transcript-bar">
              <span className="listening-indicator">
                <span className="pulse"></span>
                Listening...
              </span>
              <span className="transcript-text">
                {interimTranscript || 'Speak now...'}
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            {/* Voice Button */}
            <button
              className={`voice-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleVoiceButton}
              disabled={!isConnected || !sttSupported}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isListening ? (
                  <rect x="6" y="4" width="12" height="16" rx="2" />
                ) : (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                )}
              </svg>
              {isListening && <span className="voice-ripple"></span>}
            </button>

            {/* Text Input */}
            <form onSubmit={handleSendText} className="text-input-form">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask about NovaTech Solutions..."
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !textInput.trim()}
                className="send-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>

          {/* Controls */}
          <div className="controls">
            <button
              className={`control-btn ${isConnected ? 'connected' : ''}`}
              onClick={isConnected ? disconnect : connect}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
            <button
              className="control-btn"
              onClick={clearHistory}
              disabled={!isConnected}
            >
              Clear History
            </button>
            <label className="control-toggle">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
              <span>Auto-speak responses</span>
            </label>
            {isSpeaking && (
              <button className="control-btn stop-btn" onClick={stopSpeaking}>
                🔊 Stop Speaking
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
