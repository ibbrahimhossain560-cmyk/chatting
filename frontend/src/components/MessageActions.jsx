import { motion, AnimatePresence } from "framer-motion";
import { 
  Reply, 
  Forward, 
  Trash2, 
  Star, 
  Copy, 
  MoreVertical,
  X 
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const MessageActions = ({ 
  message, 
  isOwnMessage, 
  onReply, 
  onForward, 
  onDelete, 
  onStar,
  isStarred,
  position = "left" 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = async () => {
    if (message.text) {
      await navigator.clipboard.writeText(message.text);
      toast.success("Message copied!");
    }
    setShowMenu(false);
  };

  const handleDelete = (forEveryone) => {
    onDelete(message._id, forEveryone);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const menuItems = [
    { 
      icon: Reply, 
      label: "Reply", 
      onClick: () => { onReply(message); setShowMenu(false); },
      show: true,
    },
    { 
      icon: Copy, 
      label: "Copy", 
      onClick: handleCopy,
      show: !!message.text && !message.deletedForEveryone,
    },
    { 
      icon: Star, 
      label: isStarred ? "Unstar" : "Star", 
      onClick: () => { onStar(message._id); setShowMenu(false); },
      show: !message.deletedForEveryone,
      active: isStarred,
    },
    { 
      icon: Forward, 
      label: "Forward", 
      onClick: () => { onForward(message); setShowMenu(false); },
      show: !message.deletedForEveryone,
    },
    { 
      icon: Trash2, 
      label: "Delete", 
      onClick: () => setShowDeleteConfirm(true),
      show: true,
      danger: true,
    },
  ].filter(item => item.show);

  return (
    <div className="relative">
      {/* Menu trigger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMenu(!showMenu)}
        className="btn btn-ghost btn-circle btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="size-4" />
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute z-50 ${position === "left" ? "left-0" : "right-0"} top-full mt-1 bg-base-100 rounded-xl shadow-xl border border-base-300 overflow-hidden min-w-[140px]`}
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors ${
                    item.danger ? "text-error hover:bg-error/10" : ""
                  } ${item.active ? "text-warning" : ""}`}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-base-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Delete Message</h3>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  <X className="size-4" />
                </button>
              </div>
              
              <p className="text-base-content/70 mb-6">
                {isOwnMessage 
                  ? "How would you like to delete this message?"
                  : "This will delete the message from your view only."}
              </p>
              
              <div className="flex flex-col gap-2">
                {isOwnMessage && (
                  <button
                    onClick={() => handleDelete(true)}
                    className="btn btn-error btn-outline"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete for everyone
                  </button>
                )}
                <button
                  onClick={() => handleDelete(false)}
                  className="btn btn-ghost"
                >
                  Delete for me
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageActions;
