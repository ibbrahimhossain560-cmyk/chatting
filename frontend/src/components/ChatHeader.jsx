import { X, Phone, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Badge from "./Badge";
import UserProfileModal from "./UserProfileModal";
import NicknameModal from "./NicknameModal";
import { useState, useEffect } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, nicknames, getConversationNicknames } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall, callStatus } = useCallStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isInCall = callStatus !== "idle";
  
  // Get nickname for this user
  const userNickname = nicknames[selectedUser._id]?.myNicknameForThem;

  // Fetch nicknames when selected user changes
  useEffect(() => {
    if (selectedUser?._id) {
      getConversationNicknames(selectedUser._id);
    }
  }, [selectedUser?._id, getConversationNicknames]);

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
        onSetNickname={() => {
          setShowProfileModal(false);
          setShowNicknameModal(true);
        }}
      />

      <NicknameModal
        user={selectedUser}
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
      />

      {/* Sticky header - always on top */}
      <div className="sticky top-0 z-50 p-2 sm:p-2.5 border-b border-base-300 bg-base-100/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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

            {/* User info - name/nickname and badge directly together */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-0">
                <h3 className="font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-[160px] text-base-content leading-none">
                  {userNickname || selectedUser.fullName}
                </h3>
                {selectedUser.badgeType && selectedUser.badgeType !== "none" && (
                  <Badge badgeType={selectedUser.badgeType} size="sm" className="-ml-0.5" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                <p className="text-xs text-base-content/60">
                  {isOnline ? "Online" : "Offline"}
                </p>
                {userNickname ? (
                  <span className="text-xs text-base-content/40 ml-1">({selectedUser.fullName})</span>
                ) : selectedUser.username && (
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
