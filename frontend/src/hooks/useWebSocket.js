import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connection to voice agent backend
 */
export function useWebSocket(url) {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const wsRef = useRef(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'connected':
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: data.content,
                        timestamp: new Date()
                    }]);
                    break;
                case 'typing':
                    setIsTyping(data.content);
                    break;
                case 'response':
                    setIsTyping(false);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: data.content,
                        timestamp: new Date()
                    }]);
                    break;
                case 'error':
                    console.error('Server error:', data.content);
                    setIsTyping(false);
                    break;
                case 'cleared':
                    setMessages([{
                        role: 'assistant',
                        content: data.content,
                        timestamp: new Date()
                    }]);
                    break;
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        wsRef.current = ws;
    }, [url]);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((content) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            setMessages(prev => [...prev, {
                role: 'user',
                content,
                timestamp: new Date()
            }]);
            wsRef.current.send(JSON.stringify({
                type: 'message',
                content
            }));
        }
    }, []);

    const clearHistory = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'clear_history'
            }));
        }
    }, []);

    useEffect(() => {
        return () => {
            wsRef.current?.close();
        };
    }, []);

    return {
        isConnected,
        messages,
        isTyping,
        connect,
        disconnect,
        sendMessage,
        clearHistory
    };
}
