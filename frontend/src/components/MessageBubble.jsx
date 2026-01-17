import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { 
  Reply, Forward, Copy, Trash2, Star, Edit2, X, 
  Check, CheckCheck, Play, Pause, SmilePlus, ArrowUp
} from "lucide-react";
import Badge from "./Badge";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";

// Common emoji reactions
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

const MessageBubble = ({
  message,
  isOwnMessage,
  authUser,
  selectedUser,
  onReply,
  onForward,
  onDelete,
  onStar,
  onEdit,
  isStarred,
  onReaction,
  reactions = [],
  readReceipt,
  playingAudio,
  onPlayAudio,
  audioRef,
  onScrollToMessage,
  onScrollToTop,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const longPressTimer = useRef(null);
  const bubbleRef = useRef(null);

  // Swipe gesture
  const x = useMotionValue(0);
  const swipeThreshold = 80;
  const replyOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);
  const replyScale = useTransform(x, [0, swipeThreshold], [0.5, 1]);

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) > swipeThreshold) {
      // Swipe right to reply
      if (info.offset.x > 0 && !message.deletedForEveryone) {
        onReply(message);
        toast("Replying to message", { icon: "↩️", duration: 1500 });
      }
    }
  };

  // Long press handlers
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      if (!message.deletedForEveryone) {
        setShowPopup(true);
      }
    }, 500);
  }, [message.deletedForEveryone]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleCopy = async () => {
    if (message.text) {
      await navigator.clipboard.writeText(message.text);
      toast.success("Copied!");
    }
    setShowPopup(false);
  };

  const handleEdit = () => {
    if (isOwnMessage && message.text && !message.deletedForEveryone) {
      setIsEditing(true);
      setShowPopup(false);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = (forEveryone) => {
    onDelete(message._id, forEveryone);
    setShowDeleteOptions(false);
    setShowPopup(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isDeleted = message.deletedForEveryone;
  const isNicknameChange = message.messageType === "nickname_change";
  const isSystemMessage = message.messageType === "system" || isNicknameChange;

  // Render system/nickname change messages differently
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-base-200/70 px-3 py-1.5 rounded-full text-xs text-base-content/70">
          <span className="font-medium">{isOwnMessage ? "You" : selectedUser.fullName}</span>
          {" "}{message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat ${isOwnMessage ? "chat-end" : "chat-start"} relative`}>
      {/* Swipe reply indicator */}
      <motion.div
        style={{ opacity: replyOpacity, scale: replyScale }}
        className={`absolute ${isOwnMessage ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2`}
      >
        <div className="bg-primary text-primary-content rounded-full p-2">
          <Reply className="size-4" />
        </div>
      </motion.div>

      {/* Avatar */}
      <div className="chat-image avatar">
        <div className="size-8 sm:size-9 rounded-full ring-2 ring-base-300">
          <img
            src={isOwnMessage ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
            alt="avatar"
            className="rounded-full object-cover"
          />
        </div>
      </div>

      {/* Header */}
      <div className="chat-header mb-0.5 flex items-center gap-1">
        <span className="text-xs font-medium opacity-70 flex items-center gap-0.5">
          {isOwnMessage ? "You" : selectedUser.fullName.split(" ")[0]}
          {!isOwnMessage && selectedUser.badgeType && selectedUser.badgeType !== "none" && (
            <Badge badgeType={selectedUser.badgeType} size="xs" />
          )}
          {isOwnMessage && authUser.badgeType && authUser.badgeType !== "none" && (
            <Badge badgeType={authUser.badgeType} size="xs" />
          )}
        </span>
        <time className="text-[10px] opacity-50">{formatMessageTime(message.createdAt)}</time>
        {message.isEdited && <span className="text-[10px] opacity-40">(edited)</span>}
        {message.isForwarded && <span className="text-[10px] opacity-40 flex items-center"><Forward className="size-2.5 mr-0.5" />Forwarded</span>}
      </div>

      {/* Message bubble with swipe */}
      <motion.div
        ref={bubbleRef}
        drag={isDeleted ? false : "x"}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        className={`chat-bubble relative cursor-pointer select-none ${
          isDeleted
            ? "bg-base-200/50 text-base-content/50 italic"
            : isOwnMessage
            ? "bg-primary text-primary-content"
            : "bg-base-200 text-base-content"
        } shadow-sm max-w-[80%] sm:max-w-[70%]`}
      >
        {/* Reply preview - clickable to scroll to original */}
        {message.replyTo && (
          <div 
            className="mb-1.5 p-1.5 bg-black/10 rounded border-l-2 border-primary/50 text-xs cursor-pointer hover:bg-black/20 active:bg-black/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (onScrollToMessage && message.replyTo._id) {
                onScrollToMessage(message.replyTo._id);
              }
            }}
          >
            <p className="truncate opacity-70 max-w-[200px]">
              {message.replyTo.text || (message.replyTo.image ? "📷 Photo" : "🎤 Voice")}
            </p>
          </div>
        )}

        {/* Image */}
        {message.image && !isDeleted && (
          <img
            src={message.image}
            alt="Attachment"
            className="max-w-[200px] sm:max-w-[260px] rounded-lg mb-1.5 cursor-pointer"
            onClick={() => window.open(message.image, "_blank")}
          />
        )}

        {/* Voice message */}
        {message.audio && !isDeleted && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <audio ref={audioRef} src={message.audio} />
            <button onClick={() => onPlayAudio(message._id)} className="btn btn-circle btn-xs btn-ghost">
              {playingAudio === message._id ? <Pause className="size-3" /> : <Play className="size-3" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-0.5">
                {[...Array(15)].map((_, i) => (
                  <div key={i} style={{ height: `${Math.random() * 10 + 3}px` }} className="w-0.5 bg-current opacity-60 rounded-full" />
                ))}
              </div>
              <span className="text-[10px] opacity-60">{formatDuration(message.audioDuration || 0)}</span>
            </div>
          </div>
        )}

        {/* Text or editing */}
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="input input-xs input-bordered bg-base-100 text-base-content w-full"
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <button onClick={() => setIsEditing(false)} className="btn btn-xs btn-ghost">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-xs btn-primary">Save</button>
            </div>
          </div>
        ) : message.text && (
          <p className={`text-sm break-words ${isDeleted ? "italic" : ""}`}>{message.text}</p>
        )}

        {/* Read receipt */}
        {isOwnMessage && !isDeleted && (
          <div className="flex justify-end mt-0.5">
            {message.read || readReceipt ? (
              <CheckCheck className="size-3.5 text-blue-400" />
            ) : (
              <Check className="size-3.5 opacity-60" />
            )}
          </div>
        )}

        {/* Reactions display */}
        {reactions.length > 0 && (
          <div className={`absolute -bottom-2.5 ${isOwnMessage ? "left-1" : "right-1"} flex gap-0.5 bg-base-100 rounded-full shadow px-1 py-0.5 border border-base-200`}>
            {reactions.slice(0, 3).map((r, i) => <span key={i} className="text-xs">{r.emoji}</span>)}
            {reactions.length > 3 && <span className="text-[10px] text-base-content/60">+{reactions.length - 3}</span>}
          </div>
        )}
      </motion.div>

      {/* Long press popup menu - perfectly centered on screen */}
      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowPopup(false); setShowDeleteOptions(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-base-100 rounded-xl shadow-2xl border border-base-300 overflow-hidden pointer-events-auto w-[260px] max-w-[85vw] max-h-[80vh]">
              {/* Message preview */}
              <div className="p-2.5 border-b border-base-200 bg-base-200/30">
                <p className="text-xs truncate">{message.text || (message.image ? "📷 Photo" : "🎤 Voice")}</p>
              </div>

              {/* Quick reactions */}
              <div className="flex justify-center gap-0.5 p-1.5 border-b border-base-200">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onReaction(message._id, emoji); setShowPopup(false); }}
                    className="text-lg hover:scale-110 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Actions - compact */}
              <div className="py-0.5 max-h-[40vh] overflow-y-auto">
                <button onClick={() => { onReply(message); setShowPopup(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs">
                  <Reply className="size-3.5" /> Reply
                </button>
                
                {message.text && (
                  <button onClick={handleCopy} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs">
                    <Copy className="size-3.5" /> Copy
                  </button>
                )}
                
                {isOwnMessage && message.text && (
                  <button onClick={handleEdit} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs">
                    <Edit2 className="size-3.5" /> Edit
                  </button>
                )}
                
                <button onClick={() => { onForward(message); setShowPopup(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs">
                  <Forward className="size-3.5" /> Forward
                </button>
                
                <button onClick={() => { onStar(message._id); setShowPopup(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs">
                  <Star className={`size-3.5 ${isStarred ? "fill-warning text-warning" : ""}`} /> {isStarred ? "Unstar" : "Star"}
                </button>
                
                <button onClick={() => { onScrollToTop?.(); setShowPopup(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs">
                  <ArrowUp className="size-3.5" /> Go to top
                </button>

                {/* Delete options */}
                {!showDeleteOptions ? (
                  <button onClick={() => setShowDeleteOptions(true)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-error/10 text-error text-xs">
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                ) : (
                  <div className="border-t border-base-200 mt-0.5 pt-0.5">
                    <p className="text-[10px] text-center text-base-content/60 py-1">Delete message?</p>
                    <button 
                      onClick={() => handleDelete(false)} 
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-base-200 text-xs"
                    >
                      <Trash2 className="size-3.5" /> Delete for me
                    </button>
                    {isOwnMessage && (
                      <button 
                        onClick={() => handleDelete(true)} 
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-error/10 text-error text-xs"
                      >
                        <Trash2 className="size-3.5" /> Unsend for everyone
                      </button>
                    )}
                  </div>
                )}
              </div>

                {/* Close button - compact */}
                <div className="border-t border-base-200 p-1.5">
                  <button 
                    onClick={() => { setShowPopup(false); setShowDeleteOptions(false); }} 
                    className="w-full btn btn-xs btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageBubble;
