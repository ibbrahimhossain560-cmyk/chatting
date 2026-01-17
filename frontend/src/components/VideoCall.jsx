import { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
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
        return <SignalHigh className="w-4 h-4 text-green-400" />;
      case "medium":
        return <SignalMedium className="w-4 h-4 text-yellow-400" />;
      case "poor":
        return <SignalLow className="w-4 h-4 text-red-400" />;
      case "reconnecting":
        return <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />;
      default:
        return <Signal className="w-4 h-4 text-white/50" />;
    }
  };

  if (callStatus === "idle" || callStatus === "receiving") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${
          isFullscreen ? "" : "sm:inset-4 sm:rounded-2xl sm:shadow-2xl"
        }`}
        onClick={() => setShowControls(true)}
      >
        {/* Hidden audio element for audio calls */}
        <audio ref={remoteAudioRef} autoPlay playsInline hidden />

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
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 p-4">
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
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
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
                    <Pause className="w-10 h-10 text-white" />
                  </div>
                )}
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {otherUser?.fullName}
                </h3>
                <p className="text-white/70 mt-1 sm:mt-2 text-sm sm:text-base">
                  {callStatus === "calling"
                    ? "Calling..."
                    : callStatus === "reconnecting"
                    ? "Reconnecting..."
                    : callStatus === "ongoing"
                    ? callDuration
                    : "Connecting..."}
                </p>
                {isOnHold && (
                  <p className="text-yellow-400 mt-1 text-sm">Call on hold</p>
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
              className="absolute top-4 right-4 w-20 h-28 sm:w-28 sm:h-40 md:w-40 md:h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-move"
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
                  <VideoOff className="text-white/50 w-6 h-6 sm:w-8 sm:h-8" />
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
                className="absolute top-4 left-4 flex items-center gap-2 sm:gap-3"
              >
                {/* Call status badge */}
                <div
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md text-xs sm:text-sm ${
                    callStatus === "ongoing"
                      ? "bg-green-500/20 text-green-400"
                      : callStatus === "reconnecting"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {callStatus === "ongoing" ? (
                      <>
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="font-medium">{callDuration}</span>
                      </>
                    ) : callStatus === "reconnecting" ? (
                      <>
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        <span className="font-medium">Reconnecting...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 animate-pulse" />
                        <span className="font-medium">
                          {isVideoCall ? "Video" : "Audio"} Call
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Network quality indicator */}
                <div className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-full backdrop-blur-md bg-black/30 flex items-center gap-1.5">
                  {getNetworkIcon()}
                  <span className="text-xs text-white/70 hidden sm:inline">
                    {networkQuality === "good" ? "Good" : networkQuality === "medium" ? "Fair" : networkQuality === "poor" ? "Poor" : "..."}
                  </span>
                </div>

                {/* Low data mode indicator */}
                {lowDataMode && (
                  <div className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-full backdrop-blur-md bg-blue-500/20 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-400 hidden sm:inline">Low Data</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 w-full px-4 sm:px-0 sm:w-auto"
              >
                <div className="flex items-center justify-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-black/40 mx-auto max-w-fit">
                  {/* Mute button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMute}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                      isMuted
                        ? "bg-red-500 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </motion.button>

                  {/* Video toggle (only for video calls) */}
                  {isVideoCall && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleVideo}
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                        isVideoOff
                          ? "bg-red-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {isVideoOff ? (
                        <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </motion.button>
                  )}

                  {/* Speaker toggle */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSpeaker}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                      !isSpeakerOn
                        ? "bg-red-500 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {isSpeakerOn ? (
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </motion.button>

                  {/* End call button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endCall}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
                  >
                    <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.button>

                  {/* Hold button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleHold}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                      isOnHold
                        ? "bg-yellow-500 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {isOnHold ? (
                      <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </motion.button>

                  {/* Switch camera (only for video calls) */}
                  {isVideoCall && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={switchCamera}
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
                    >
                      <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                  )}

                  {/* Fullscreen toggle */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center hidden sm:flex"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </motion.button>
                </div>

                {/* Low data mode toggle */}
                <div className="mt-3 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLowDataMode(!lowDataMode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      lowDataMode
                        ? "bg-blue-500/30 text-blue-300"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      {lowDataMode ? "Low Data Mode On" : "Enable Low Data Mode"}
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
