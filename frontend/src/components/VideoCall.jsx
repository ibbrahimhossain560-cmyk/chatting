import { useEffect, useRef, useState } from "react";
import { useCallStore, formatCallDuration } from "../store/useCallStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Phone,
  Volume2,
  VolumeX,
  Pause,
  Play,
  SwitchCamera,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Zap,
} from "lucide-react";

const VideoCall = () => {
  const {
    callStatus,
    callType,
    caller,
    receiver,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    isOnHold,
    usingFrontCamera,
    lowDataMode,
    networkQuality,
    callStartTime,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleHold,
    switchCamera,
    setLowDataMode,
    endCall,
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");
  const [showControls, setShowControls] = useState(true);

  // Format call duration
  useEffect(() => {
    let interval;
    if ((callStatus === "ongoing" || callStatus === "reconnecting") && callStartTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60).toString().padStart(2, "0");
        const seconds = (duration % 60).toString().padStart(2, "0");
        setCallDuration(hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus, callStartTime]);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video/audio stream
  useEffect(() => {
    if (remoteStream) {
      console.log("Setting remote stream with tracks:", remoteStream.getTracks().map(t => t.kind));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        // Try to play audio (handle autoplay restrictions)
        remoteAudioRef.current.play().catch(err => {
          console.log("Audio autoplay failed, user interaction may be needed:", err);
        });
      }
    }
  }, [remoteStream]);

  // Auto-hide controls
  useEffect(() => {
    if (callStatus === "ongoing") {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [callStatus, showControls]);

  const otherUser = caller || receiver;
  const isVideoCall = callType === "video";

  // Network quality icon
  const getNetworkIcon = () => {
    switch (networkQuality) {
      case "good":
        return <SignalHigh className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />;
      case "medium":
        return <SignalMedium className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />;
      case "poor":
        return <SignalLow className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />;
      case "reconnecting":
        return <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 animate-pulse" />;
      default:
        return <Signal className="w-3 h-3 sm:w-4 sm:h-4 text-white/50" />;
    }
  };

  if (callStatus === "idle" || callStatus === "receiving") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
        onClick={() => setShowControls(true)}
      >
        {/* Hidden audio element for audio calls - ensure it plays */}
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          playsInline 
          controls={false}
          style={{ display: 'none' }}
        />

        {/* Main video area */}
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
          {/* Remote Video / Audio Placeholder */}
          {isVideoCall && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-6 p-4 w-full max-w-sm mx-auto">
              <motion.div
                animate={{
                  scale: callStatus === "calling" ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  repeat: callStatus === "calling" ? Infinity : 0,
                  duration: 1.5,
                }}
                className="relative"
              >
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                  <img
                    src={otherUser?.profilePic || "/avatar.png"}
                    alt={otherUser?.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {callStatus === "calling" && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary"
                    animate={{
                      scale: [1, 1.4],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeOut",
                    }}
                  />
                )}
                {isOnHold && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                )}
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {otherUser?.fullName}
                </h3>
                <p className="text-white/70 mt-1 text-sm sm:text-base">
                  {callStatus === "calling"
                    ? "Calling..."
                    : callStatus === "connecting"
                    ? "Connecting..."
                    : callStatus === "reconnecting"
                    ? "Reconnecting..."
                    : callStatus === "ongoing"
                    ? callDuration
                    : "..."}
                </p>
                {isOnHold && (
                  <p className="text-yellow-400 mt-1 text-xs sm:text-sm">Call on hold</p>
                )}
              </div>
            </div>
          )}

          {/* Local Video (Picture in Picture) */}
          {isVideoCall && localStream && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              drag
              dragMomentum={false}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 w-16 h-24 sm:w-24 sm:h-36 md:w-32 md:h-44 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-move"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${isVideoOff ? "hidden" : ""}`}
              />
              {isVideoOff && (
                <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                  <VideoOff className="text-white/50 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </motion.div>
          )}

          {/* Call info header */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2"
              >
                {/* Call status badge */}
                <div
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md text-[10px] sm:text-xs ${
                    callStatus === "ongoing"
                      ? "bg-green-500/20 text-green-400"
                      : callStatus === "reconnecting"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : callStatus === "connecting"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {callStatus === "ongoing" ? (
                      <>
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="font-medium">{callDuration}</span>
                      </>
                    ) : callStatus === "reconnecting" ? (
                      <>
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-pulse" />
                        <span className="font-medium">Reconnecting...</span>
                      </>
                    ) : callStatus === "connecting" ? (
                      <>
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="font-medium">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                        <span className="font-medium hidden xs:inline">
                          {isVideoCall ? "Video" : "Audio"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Network quality indicator */}
                <div className="p-1.5 sm:px-2 sm:py-1.5 rounded-full backdrop-blur-md bg-black/30 flex items-center gap-1">
                  {getNetworkIcon()}
                </div>

                {/* Low data mode indicator */}
                {lowDataMode && (
                  <div className="p-1.5 sm:px-2 sm:py-1.5 rounded-full backdrop-blur-md bg-blue-500/20 flex items-center">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls - fully responsive */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 safe-area-inset-bottom"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  {/* Main controls row */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 rounded-2xl backdrop-blur-xl bg-black/40 w-full max-w-md mx-auto">
                    {/* Mute button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMute}
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        isMuted
                          ? "bg-red-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {isMuted ? (
                        <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      ) : (
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      )}
                    </motion.button>

                    {/* Video toggle (only for video calls) */}
                    {isVideoCall && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleVideo}
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                          isVideoOff
                            ? "bg-red-500 text-white"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {isVideoOff ? (
                          <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        ) : (
                          <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        )}
                      </motion.button>
                    )}

                    {/* Speaker toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleSpeaker}
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        !isSpeakerOn
                          ? "bg-red-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {isSpeakerOn ? (
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      ) : (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      )}
                    </motion.button>

                    {/* End call button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={endCall}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0"
                    >
                      <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </motion.button>

                    {/* Hold button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleHold}
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        isOnHold
                          ? "bg-yellow-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {isOnHold ? (
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      ) : (
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      )}
                    </motion.button>

                    {/* Switch camera (only for video calls) */}
                    {isVideoCall && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={switchCamera}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center flex-shrink-0"
                      >
                        <SwitchCamera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </motion.button>
                    )}
                  </div>

                  {/* Low data mode toggle */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLowDataMode(!lowDataMode)}
                    className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                      lowDataMode
                        ? "bg-blue-500/30 text-blue-300"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      {lowDataMode ? "Low Data On" : "Low Data"}
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCall;
