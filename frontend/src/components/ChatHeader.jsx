import { X, Phone, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Badge from "./Badge";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall, callStatus } = useCallStore();

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isInCall = callStatus !== "idle";

  const handleAudioCall = () => {
    if (!isOnline) {
      toast.error("User is offline. Cannot make a call.");
      return;
    }
    if (isInCall) {
      toast.error("You are already in a call.");
      return;
    }
    initiateCall(selectedUser, "audio");
  };

  const handleVideoCall = () => {
    if (!isOnline) {
      toast.error("User is offline. Cannot make a call.");
      return;
    }
    if (isInCall) {
      toast.error("You are already in a call.");
      return;
    }
    initiateCall(selectedUser, "video");
  };

  return (
    <div className="p-2.5 sm:p-4 border-b border-base-300 bg-base-100/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar with online indicator */}
          <div className="avatar">
            <div className="size-10 sm:size-12 rounded-full relative ring-2 ring-offset-2 ring-offset-base-100 ring-primary/20">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="rounded-full object-cover"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                {selectedUser.fullName}
              </h3>
              <Badge badgeType={selectedUser.badgeType} size="xs" />
              {selectedUser.isPremium && (
                <span className="text-xs">✨</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <p className="text-xs sm:text-sm text-base-content/70">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Audio call button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAudioCall}
            disabled={!isOnline || isInCall}
            className={`btn btn-circle btn-sm sm:btn-md ${
              isOnline && !isInCall
                ? "btn-ghost hover:bg-primary/20 hover:text-primary"
                : "btn-disabled opacity-50"
            }`}
            title="Audio Call"
          >
            <Phone className="size-4 sm:size-5" />
          </motion.button>

          {/* Video call button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVideoCall}
            disabled={!isOnline || isInCall}
            className={`btn btn-circle btn-sm sm:btn-md ${
              isOnline && !isInCall
                ? "btn-ghost hover:bg-primary/20 hover:text-primary"
                : "btn-disabled opacity-50"
            }`}
            title="Video Call"
          >
            <Video className="size-4 sm:size-5" />
          </motion.button>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedUser(null)}
            className="btn btn-circle btn-sm sm:btn-md btn-ghost hover:bg-error/20 hover:text-error"
          >
            <X className="size-4 sm:size-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
