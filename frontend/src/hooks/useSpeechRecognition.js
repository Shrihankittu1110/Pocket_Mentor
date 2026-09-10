import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (onCommand) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        setIsSupported(true);
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript.trim().toLowerCase();
          setTranscript(text);

          // Command Matching
          let recognized = null;
          if (text.includes('next')) recognized = 'next';
          else if (text.includes('previous') || text.includes('back')) recognized = 'previous';
          else if (text.includes('show answer') || text.includes('flip') || text.includes('reveal')) recognized = 'flip';
          else if (text.includes('easy')) recognized = 'easy';
          else if (text.includes('hard')) recognized = 'hard';
          else if (text.includes('repeat') || text.includes('read again') || text.includes('listen again')) recognized = 'repeat';
          else if (text.includes('start quiz') || text.includes('take quiz')) recognized = 'start_quiz';
          else if (text.includes('option a') || text === 'a') recognized = 'option_a';
          else if (text.includes('option b') || text === 'b') recognized = 'option_b';
          else if (text.includes('option c') || text === 'c') recognized = 'option_c';
          else if (text.includes('option d') || text === 'd') recognized = 'option_d';
          else if (text.includes('true')) recognized = 'true';
          else if (text.includes('false')) recognized = 'false';

          if (recognized) {
            setLastCommand(recognized);
            if (onCommand) onCommand(recognized, text);
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition event:', event.error);
          if (event.error === 'not-allowed') {
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          // If still marked as listening, restart (continuous mode fallback)
          if (recognitionRef.current && recognitionRef.current._shouldStayActive) {
            try {
              recognition.start();
            } catch (e) {}
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current._shouldStayActive = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [onCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current._shouldStayActive = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current._shouldStayActive = false;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    lastCommand,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
};
