import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageActions from "./MessageActions";
import ForwardModal from "./ForwardModal";
import Badge from "./Badge";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, SmilePlus, Forward, Play, Pause, Search, X } from "lucide-react";

// Common emoji reactions
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
    readReceipts,
    messageReactions,
    markMessagesAsRead,
    addReaction,
    deleteMessage,
    toggleStarMessage,
    setReplyToMessage,
    starredMessages,
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (messages.length > 0 && selectedUser) {
      const unreadMessages = messages.filter(
        (m) => m.senderId === selectedUser._id && !m.read
      );
      if (unreadMessages.length > 0) {
        markMessagesAsRead(selectedUser._id);
      }
    }
  }, [messages, selectedUser, markMessagesAsRead]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
    setShowReactionPicker(null);
  };

  const getMessageReactions = (messageId) => {
    const reactions = messageReactions[messageId];
    if (Array.isArray(reactions)) return reactions;
    if (reactions && typeof reactions === "object") {
      return Object.entries(reactions).map(([userId, emoji]) => ({ userId, emoji }));
    }
    return [];
  };

  const handlePlayAudio = (messageId, audioUrl) => {
    if (playingAudio === messageId) {
      audioRefs.current[messageId]?.pause();
      setPlayingAudio(null);
    } else {
      // Pause any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      audioRefs.current[messageId]?.play();
      setPlayingAudio(messageId);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isTyping = typingUsers[selectedUser?._id];
  
  // Sort messages by timestamp and apply search filter if needed
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  const sortedSearchResults = [...searchResults].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  const displayMessages = searchQuery ? sortedSearchResults : sortedMessages;

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
        <div className="sticky top-0 z-20 flex-shrink-0">
          <ChatHeader />
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <div className="sticky bottom-0 z-10 flex-shrink-0">
          <MessageInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-base-100 to-base-200/30 h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex-shrink-0">
        <ChatHeader />
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-base-200 overflow-hidden flex-shrink-0"
          >
            <div className="p-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full input input-sm pl-9 pr-8 bg-base-200 rounded-lg"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="size-4 text-base-content/40" />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowSearch(false); clearSearch(); }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
            {searchQuery && (
              <div className="px-3 pb-2 text-xs text-base-content/60">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {sortedMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-10"
          >
            <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mb-4">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/60 mt-1">
              Start a conversation with {selectedUser.fullName.split(" ")[0]}
            </p>
          </motion.div>
        )}

        {displayMessages.map((message, index) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={index === displayMessages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-8 sm:size-10 rounded-full ring-2 ring-offset-2 ring-offset-base-100 ring-base-300">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                  className="rounded-full object-cover"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center gap-2">
              <span className="text-xs font-medium opacity-70 flex items-center gap-1">
                {message.senderId === authUser._id ? "You" : selectedUser.fullName.split(" ")[0]}
                {message.senderId !== authUser._id && selectedUser.badgeType && selectedUser.badgeType !== "none" && (
                  <Badge badgeType={selectedUser.badgeType} size="xs" />
                )}
                {message.senderId === authUser._id && authUser.badgeType && authUser.badgeType !== "none" && (
                  <Badge badgeType={authUser.badgeType} size="xs" />
                )}
              </span>
              <time className="text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>
              {message.isForwarded && (
                <span className="text-xs opacity-50 flex items-center gap-1">
                  <Forward className="size-3" /> Forwarded
                </span>
              )}
            </div>
            <div
              className={`chat-bubble relative group ${
                message.deletedForEveryone
                  ? "bg-base-200/50 text-base-content/50 italic"
                  : message.senderId === authUser._id
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content"
              } shadow-sm max-w-[85%] sm:max-w-[70%]`}
            >
              {/* Message actions menu */}
              {!message.deletedForEveryone && (
                <div className={`absolute ${message.senderId === authUser._id ? "-left-10" : "-right-10"} top-0`}>
                  <MessageActions
                    message={message}
                    isOwnMessage={message.senderId === authUser._id}
                    onReply={setReplyToMessage}
                    onForward={setForwardMessage}
                    onDelete={deleteMessage}
                    onStar={toggleStarMessage}
                    isStarred={starredMessages.includes(message._id)}
                    position={message.senderId === authUser._id ? "left" : "right"}
                  />
                </div>
              )}

              {/* Reaction button - appears on hover */}
              {!message.deletedForEveryone && (
                <button
                  onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)}
                  className={`absolute ${message.senderId === authUser._id ? "-left-16" : "-right-16"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-base-300`}
                >
                  <SmilePlus className="size-4 text-base-content/60" />
                </button>
              )}

              {/* Reaction picker */}
              <AnimatePresence>
                {showReactionPicker === message._id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute ${message.senderId === authUser._id ? "-left-40" : "-right-40"} top-0 bg-base-100 rounded-full shadow-lg border border-base-300 flex gap-1 p-1 z-10`}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message._id, emoji)}
                        className="hover:scale-125 transition-transform p-1 text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reply preview */}
              {message.replyTo && (
                <div className="mb-2 p-2 bg-black/10 rounded-lg border-l-2 border-primary/50 text-xs">
                  <p className="truncate opacity-70">
                    {message.replyTo.text || (message.replyTo.image ? "📷 Photo" : "🎤 Voice")}
                  </p>
                </div>
              )}

              {message.image && !message.deletedForEveryone && (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={message.image}
                  alt="Attachment"
                  className="max-w-[200px] sm:max-w-[280px] rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.image, "_blank")}
                />
              )}

              {/* Voice message */}
              {message.audio && !message.deletedForEveryone && (
                <div className="flex items-center gap-2 min-w-[150px]">
                  <audio
                    ref={(el) => { audioRefs.current[message._id] = el; }}
                    src={message.audio}
                    onEnded={() => setPlayingAudio(null)}
                  />
                  <button
                    onClick={() => handlePlayAudio(message._id, message.audio)}
                    className="btn btn-circle btn-sm btn-ghost"
                  >
                    {playingAudio === message._id ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-0.5">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          style={{ height: `${Math.random() * 12 + 4}px` }}
                          className="w-0.5 bg-current opacity-60 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-xs opacity-60">
                      {formatDuration(message.audioDuration || 0)}
                    </span>
                  </div>
                </div>
              )}

              {message.text && (
                <p className={`text-sm sm:text-base break-words ${message.deletedForEveryone ? "italic" : ""}`}>
                  {message.text}
                </p>
              )}

              {/* Read receipts for sent messages */}
              {message.senderId === authUser._id && !message.deletedForEveryone && (
                <div className="flex justify-end mt-1">
                  {message.read || readReceipts[selectedUser._id] ? (
                    <CheckCheck className="size-4 text-blue-400" />
                  ) : (
                    <Check className="size-4 opacity-60" />
                  )}
                </div>
              )}

              {/* Message reactions display */}
              {getMessageReactions(message._id).length > 0 && (
                <div className={`absolute -bottom-3 ${message.senderId === authUser._id ? "left-2" : "right-2"} flex gap-0.5 bg-base-100 rounded-full shadow-md px-1.5 py-0.5 border border-base-200`}>
                  {getMessageReactions(message._id).slice(0, 3).map((reaction, i) => (
                    <span key={i} className="text-xs">{reaction.emoji}</span>
                  ))}
                  {getMessageReactions(message._id).length > 3 && (
                    <span className="text-xs text-base-content/60">+{getMessageReactions(message._id).length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="chat chat-start"
            >
              <div className="chat-image avatar">
                <div className="size-8 sm:size-10 rounded-full">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.fullName}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="chat-bubble bg-base-200 text-base-content">
                <div className="flex gap-1 items-center py-1">
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="w-2 h-2 bg-base-content/40 rounded-full"
                  />
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                    className="w-2 h-2 bg-base-content/40 rounded-full"
                  />
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                    className="w-2 h-2 bg-base-content/40 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky input at bottom */}
      <div className="sticky bottom-0 z-10 flex-shrink-0">
        <MessageInput />
      </div>

      {/* Forward modal */}
      <AnimatePresence>
        {forwardMessage && (
          <ForwardModal
            message={forwardMessage}
            onClose={() => setForwardMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default ChatContainer;
