import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, PhoneCall } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useEffect, useRef } from "react";

const IncomingCall = () => {
  const { callStatus, callType, caller, acceptCall, rejectCall } = useCallStore();
  const ringtoneRef = useRef(null);

  // Play ringtone when receiving call
  useEffect(() => {
    if (callStatus === "receiving") {
      // Create a simple ringtone using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const playRingtone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };

      const ringtoneInterval = setInterval(playRingtone, 1000);
      ringtoneRef.current = { interval: ringtoneInterval, context: audioContext };

      return () => {
        clearInterval(ringtoneInterval);
        audioContext.close();
      };
    }
  }, [callStatus]);

  if (callStatus !== "receiving") return null;

  const handleAccept = () => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current.interval);
      ringtoneRef.current.context.close();
    }
    acceptCall();
  };

  const handleReject = () => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current.interval);
      ringtoneRef.current.context.close();
    }
    rejectCall();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-[90vw] sm:max-w-sm w-full"
        >
          {/* Caller info */}
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-primary shadow-xl">
                <img
                  src={caller?.profilePic || "/avatar.png"}
                  alt={caller?.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary"
                animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary"
                animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
            </motion.div>

            <div className="text-center">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold truncate max-w-[200px] sm:max-w-[250px]">
                {caller?.fullName}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-1 text-base-content/70">
                {callType === "video" ? (
                  <>
                    <Video className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Video Call</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Audio Call</span>
                  </>
                )}
              </div>
            </div>

            {/* Incoming call text with animation */}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sm text-base-content/60"
            >
              Incoming call...
            </motion.p>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 mt-4 sm:mt-6 w-full">
              {/* Reject button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReject}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.button>

              {/* Accept button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAccept}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                {callType === "video" ? (
                  <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </motion.button>
            </div>

            {/* Swipe hint for mobile */}
            <p className="text-[10px] sm:text-xs text-base-content/40 mt-2">
              Tap to answer or decline
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCall;
