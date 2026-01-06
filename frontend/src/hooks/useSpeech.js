import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for Speech-to-Text using Web Speech API
 */
export function useSpeechToText() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
                setInterimTranscript('');
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        final += result[0].transcript;
                    } else {
                        interim += result[0].transcript;
                    }
                }

                if (final) {
                    setTranscript(final);
                }
                setInterimTranscript(interim);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        startListening,
        stopListening
    };
}

/**
 * Custom hook for Text-to-Speech using Web Speech API
 */
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const utteranceRef = useRef(null);

    useEffect(() => {
        setIsSupported('speechSynthesis' in window);
    }, []);

    const speak = useCallback((text) => {
        if (!isSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to get a nice voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.startsWith('en') && v.name.includes('Google')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSupported]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return {
        isSpeaking,
        isSupported,
        speak,
        stop
    };
}
