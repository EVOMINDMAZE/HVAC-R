import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseVoiceInputReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    transcript: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    resetTranscript: () => void;
    error: string | null;
}

export function useVoiceInput(): UseVoiceInputReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        setError(null);
        setTranscript(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Chrome/Firefox standard

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsTranscribing(true);
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Create File object
                const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const { data, error: functionError } = await supabase.functions.invoke('transcribe-audio', {
                        body: formData,
                    });

                    if (functionError) throw functionError;

                    if (data?.text) {
                        setTranscript(data.text);
                    } else {
                        throw new Error("No transcription text received");
                    }

                } catch (err: any) {
                    console.error("Transcription failed:", err);
                    setError(err.message || "Failed to transcribe audio");
                } finally {
                    setIsTranscribing(false);
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);

        } catch (err: any) {
            console.error("Could not start recording:", err);
            setError("Could not access microphone");
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const resetTranscript = useCallback(() => {
        setTranscript(null);
        setError(null);
    }, []);

    return {
        isRecording,
        isTranscribing,
        transcript,
        startRecording,
        stopRecording,
        resetTranscript,
        error
    };
}
