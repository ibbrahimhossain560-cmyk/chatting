import { X, Phone, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Badge from "./Badge";
import UserProfileModal from "./UserProfileModal";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall, callStatus } = useCallStore();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isInCall = callStatus !== "idle";

  const handleAudioCall = () => {
    if (!isOnline) {
      toast.error("User is offline");
      return;
    }
    if (isInCall) {
      toast.error("Already in a call");
      return;
    }
    initiateCall(selectedUser, "audio");
  };

  const handleVideoCall = () => {
    if (!isOnline) {
      toast.error("User is offline");
      return;
    }
    if (isInCall) {
      toast.error("Already in a call");
      return;
    }
    initiateCall(selectedUser, "video");
  };

  const handleCloseChat = () => {
    setSelectedUser(null);
    window.location.href = '/';
  };

  return (
    <>
      <UserProfileModal
        user={selectedUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Fixed header with high z-index */}
      <div className="p-2.5 sm:p-3 border-b border-base-300 bg-base-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Avatar - clickable for profile */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="avatar cursor-pointer flex-shrink-0"
              onClick={() => setShowProfileModal(true)}
            >
              <div className="size-9 sm:size-11 rounded-full relative ring-2 ring-primary/20">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                  className="rounded-full object-cover"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
                )}
              </div>
            </motion.div>

            {/* User info - name and badge close together */}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[180px] text-base-content">
                  {selectedUser.fullName}
                </h3>
                {selectedUser.badgeType && selectedUser.badgeType !== "none" && (
                  <Badge badgeType={selectedUser.badgeType} size="xs" />
                )}
                {selectedUser.isPremium && (
                  <span className="text-xs">✨</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                <p className="text-xs text-base-content/60">
                  {isOnline ? "Online" : "Offline"}
                </p>
                {selectedUser.username && (
                  <span className="text-xs text-base-content/40 ml-1">@{selectedUser.username}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAudioCall}
              disabled={!isOnline || isInCall}
              className={`btn btn-circle btn-sm ${
                isOnline && !isInCall
                  ? "btn-ghost text-base-content hover:text-primary hover:bg-primary/10"
                  : "btn-disabled opacity-40"
              }`}
              title="Audio Call"
            >
              <Phone className="size-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVideoCall}
              disabled={!isOnline || isInCall}
              className={`btn btn-circle btn-sm ${
                isOnline && !isInCall
                  ? "btn-ghost text-base-content hover:text-primary hover:bg-primary/10"
                  : "btn-disabled opacity-40"
              }`}
              title="Video Call"
            >
              <Video className="size-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCloseChat}
              className="btn btn-circle btn-sm btn-ghost text-base-content hover:text-error hover:bg-error/10"
              title="Close"
            >
              <X className="size-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};
export default ChatHeader;
