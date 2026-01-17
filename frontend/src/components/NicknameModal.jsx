import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, User } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const NicknameModal = ({ isOpen, onClose, user }) => {
  const { nicknames, setNickname, removeNickname, getConversationNicknames } = useChatStore();
  const [nickname, setNicknameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const currentNickname = nicknames[user?._id]?.myNicknameForThem;

  useEffect(() => {
    if (isOpen && user?._id) {
      getConversationNicknames(user._id);
      setNicknameInput(currentNickname || "");
    }
  }, [isOpen, user?._id, getConversationNicknames]);

  useEffect(() => {
    setNicknameInput(currentNickname || "");
  }, [currentNickname]);

  const handleSetNickname = async () => {
    if (!nickname.trim()) return;
    
    setIsLoading(true);
    const success = await setNickname(user._id, nickname.trim());
    setIsLoading(false);
    
    if (success) {
      onClose();
    }
  };

  const handleRemoveNickname = async () => {
    setIsLoading(true);
    const success = await removeNickname(user._id);
    setIsLoading(false);
    
    if (success) {
      setNicknameInput("");
      setShowConfirmRemove(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-200">
            <h3 className="text-lg font-semibold">Set Nickname</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={user?.profilePic || "/avatar.png"}
                  alt={user?.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName}</p>
                <p className="text-sm text-base-content/60">@{user?.username}</p>
              </div>
            </div>

            {/* Current nickname */}
            {currentNickname && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Current nickname: <strong>{currentNickname}</strong>
                </span>
              </div>
            )}

            {/* Nickname input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {currentNickname ? "Change nickname" : "Set a nickname"}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter nickname..."
                maxLength={50}
                className="input input-bordered w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nickname.trim()) {
                    handleSetNickname();
                  }
                }}
              />
              <p className="text-xs text-base-content/50">
                {nickname.length}/50 characters
              </p>
            </div>

            {/* Info text */}
            <p className="text-xs text-base-content/60">
              This nickname will only be visible to you. The other person will see that you set a nickname.
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-base-200 space-y-2">
            {!showConfirmRemove ? (
              <>
                <button
                  onClick={handleSetNickname}
                  disabled={!nickname.trim() || isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      {currentNickname ? "Update Nickname" : "Set Nickname"}
                    </>
                  )}
                </button>
                
                {currentNickname && (
                  <button
                    onClick={() => setShowConfirmRemove(true)}
                    className="btn btn-ghost btn-error w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Nickname
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center">
                  Are you sure you want to remove this nickname?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirmRemove(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveNickname}
                    disabled={isLoading}
                    className="btn btn-error flex-1"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Remove"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NicknameModal;
