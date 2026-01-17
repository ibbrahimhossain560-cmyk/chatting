import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { formatCallDuration } from "../store/useCallStore";
import { motion } from "framer-motion";

const CallMessage = ({ callInfo, isOutgoing }) => {
  if (!callInfo) return null;

  const { duration, type, endedAt } = callInfo;
  const isVideoCall = type === "video";
  const wasMissed = duration === 0;

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex justify-center my-2`}
    >
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-base-200/50 text-base-content/70 text-xs sm:text-sm`}>
        <div className={`p-1.5 rounded-full ${wasMissed ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"}`}>
          {wasMissed ? (
            <PhoneMissed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : isVideoCall ? (
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="font-medium">
            {wasMissed
              ? isOutgoing
                ? "No answer"
                : "Missed call"
              : isVideoCall
              ? "Video call"
              : "Audio call"}
          </span>
          <span className="text-[10px] sm:text-xs text-base-content/50">
            {!wasMissed && duration > 0 && (
              <span>{formatCallDuration(duration)} • </span>
            )}
            {endedAt && formatTime(endedAt)}
          </span>
        </div>

        <div className={`p-1 rounded-full ${isOutgoing ? "text-primary" : "text-base-content/50"}`}>
          {isOutgoing ? (
            <PhoneOutgoing className="w-3 h-3" />
          ) : (
            <PhoneIncoming className="w-3 h-3" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CallMessage;
