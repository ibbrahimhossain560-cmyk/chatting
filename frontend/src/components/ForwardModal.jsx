import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, Forward } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const ForwardModal = ({ message, onClose }) => {
  const { users, forwardMessage } = useChatStore();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleForward = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsForwarding(true);
    try {
      await forwardMessage(message._id, selectedUsers);
      onClose();
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Forward className="size-5" />
            Forward Message
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X className="size-5" />
          </button>
        </div>

        {/* Message preview */}
        <div className="p-4 bg-base-200/50 border-b border-base-200">
          <div className="text-sm text-base-content/60 mb-1">Forwarding:</div>
          <div className="bg-base-100 rounded-lg p-3 shadow-sm">
            {message.image && (
              <img
                src={message.image}
                alt="Message attachment"
                className="w-16 h-16 object-cover rounded-lg mb-2"
              />
            )}
            {message.text && (
              <p className="text-sm line-clamp-2">{message.text}</p>
            )}
            {message.audio && (
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                🎤 Voice message
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-base-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input input-bordered pl-10"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => toggleUserSelection(user._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selectedUsers.includes(user._id)
                    ? "bg-primary/10"
                    : "hover:bg-base-200"
                }`}
              >
                <div className="relative">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {selectedUsers.includes(user._id) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="size-3 text-primary-content" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-xs text-base-content/60">
                    @{user.fullName.toLowerCase().replace(/\s/g, "")}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-base-content/50">
              No users found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 bg-base-200/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/60">
              {selectedUsers.length} selected
            </span>
            <button
              onClick={handleForward}
              disabled={selectedUsers.length === 0 || isForwarding}
              className="btn btn-primary"
            >
              {isForwarding ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Forward className="size-4 mr-2" />
                  Forward
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForwardModal;
