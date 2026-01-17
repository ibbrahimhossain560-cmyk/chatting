import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Trash2, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (audioBlob) {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        onSend(reader.result, duration);
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const handleCancel = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    onCancel();
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center gap-2 p-3 bg-base-200 rounded-2xl"
    >
      {/* Cancel button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleCancel}
        className="btn btn-circle btn-sm btn-ghost text-error"
      >
        <Trash2 className="size-4" />
      </motion.button>

      {/* Recording indicator / Audio player */}
      <div className="flex-1 flex items-center gap-3">
        {!audioBlob ? (
          <>
            {/* Recording animation */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-3 h-3 rounded-full bg-error"
              />
              <span className="text-sm font-mono">{formatTime(duration)}</span>
            </div>
            
            {/* Sound wave animation */}
            <div className="flex items-center gap-0.5 flex-1">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isRecording && !isPaused ? [8, 24, 8] : 8,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.05,
                  }}
                  className="w-1 bg-primary rounded-full"
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Audio playback */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlayback}
              className="btn btn-circle btn-sm btn-ghost"
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </motion.button>
            <span className="text-sm font-mono">{formatTime(duration)}</span>
            
            {/* Waveform visualization */}
            <div className="flex items-center gap-0.5 flex-1">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.random() * 16 + 8}px` }}
                  className="w-1 bg-primary/60 rounded-full"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recording controls */}
      {!audioBlob ? (
        <>
          {isRecording && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="btn btn-circle btn-sm btn-ghost"
            >
              {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn btn-circle btn-sm ${isRecording ? "btn-error" : "btn-primary"}`}
          >
            {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </motion.button>
        </>
      ) : (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          className="btn btn-circle btn-sm btn-primary"
        >
          <Send className="size-4" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default VoiceRecorder;
