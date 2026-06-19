"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { parseTranscript, type VoiceSchema } from "@/lib/voice/parseTranscript";

interface VoiceInputProps {
  onResult: (result: Record<string, unknown>) => void;
  schema?: VoiceSchema;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    0?: { transcript?: string };
  };
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function VoiceInput({
  onResult,
  schema,
  className = "",
  size = "md",
  label,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const onResultRef = useRef(onResult);
  const schemaRef = useRef(schema);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  useEffect(() => {
    const SpeechRecognition =
      (window as Window & {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => {
      transcriptRef.current = "";
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalTranscript += piece;
        else interim += piece;
      }
      transcriptRef.current = `${finalTranscript} ${interim}`.trim();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const transcript = transcriptRef.current.trim();
      if (!transcript) return;
      setIsProcessing(true);
      try {
        const parsed = parseTranscript(transcript, schemaRef.current);
        onResultRef.current?.(parsed);
      } catch (error) {
        console.error("Failed to parse voice input:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
      }
    }
  };

  if (isProcessing) {
    return (
      <div
        className={`inline-flex items-center justify-center gap-2 text-sm text-foreground/60 ${className}`}
        aria-live="polite"
      >
        {label ? <span>{label}</span> : <span>Processing…</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? "Listening… click to stop" : "Use voice input"}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      className={`inline-flex items-center justify-center rounded-full border-2 transition-colors shrink-0 ${
        sizeClasses[size]
      } ${
        isListening
          ? "border-light-red bg-light-red/10 text-light-red"
          : "border-foreground/10 bg-white text-foreground/70 hover:border-purple hover:text-purple hover:bg-purple-soft/20"
      } ${className}`}
    >
      {isListening ? (
        <MicOff className={iconSizes[size]} />
      ) : (
        <Mic className={iconSizes[size]} />
      )}
    </button>
  );
}
