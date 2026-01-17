import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageBubble from "./MessageBubble";
import ForwardModal from "./ForwardModal";
import CallMessage from "./CallMessage";
import { useAuthStore } from "../store/useAuthStore";
import { Search, X } from "lucide-react";

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
    editMessage,
    toggleStarMessage,
    setReplyToMessage,
    starredMessages,
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
  } = useChatStore();
  const { lastCallInfo, clearLastCallInfo } = useCallStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messageRefs = useRef({});
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [displayedCallInfo, setDisplayedCallInfo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const audioRefs = useRef({});

  // Scroll to a specific message when tapping on reply
  const scrollToMessage = useCallback((messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message briefly
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

  // Scroll to the first message (top of chat)
  const scrollToTop = useCallback(() => {
    const keys = Object.keys(messageRefs.current);
    if (keys.length > 0) {
      const firstKey = keys[0];
      messageRefs.current[firstKey]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightedMessageId(firstKey);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

  // Show last call info when it changes
  useEffect(() => {
    if (lastCallInfo && lastCallInfo.withUserId === selectedUser?._id) {
      setDisplayedCallInfo(lastCallInfo);
      clearLastCallInfo();
    }
  }, [lastCallInfo, selectedUser, clearLastCallInfo]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

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
  };

  const getMessageReactions = (messageId) => {
    const reactions = messageReactions[messageId];
    if (Array.isArray(reactions)) return reactions;
    if (reactions && typeof reactions === "object") {
      return Object.entries(reactions).map(([userId, emoji]) => ({ userId, emoji }));
    }
    return [];
  };

  const handlePlayAudio = (messageId) => {
    if (playingAudio === messageId) {
      audioRefs.current[messageId]?.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      audioRefs.current[messageId]?.play();
      setPlayingAudio(messageId);
    }
  };

  const isTyping = typingUsers[selectedUser?._id];
  
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  const sortedSearchResults = [...searchResults].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  const displayMessages = searchQuery ? sortedSearchResults : sortedMessages;

  // Early return if no selected user (after all hooks)
  if (!selectedUser) {
    return null;
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-base-100 h-full relative">
        {/* Fixed header at top */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <ChatHeader />
        </div>
        {/* Content with top padding for header */}
        <div className="flex-1 overflow-y-auto mt-14">
          <MessageSkeleton />
        </div>
        {/* Fixed input at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-base-100">
          <MessageInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-base-100 to-base-200/30 h-full relative">
      {/* Fixed header - always on top like main navbar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-base-100">
        <ChatHeader />
      </div>

      {/* Search bar - below fixed header */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-14 border-b border-base-200 overflow-hidden bg-base-100 z-20"
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
                  <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="size-4 text-base-content/40" />
                  </button>
                )}
              </div>
              <button onClick={() => { setShowSearch(false); clearSearch(); }} className="btn btn-ghost btn-sm">
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

      {/* Messages area - scrollable with padding for fixed header and input */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 ${showSearch ? '' : 'mt-14'} mb-16 sm:mb-20`}>
        {sortedMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-10"
          >
            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-3">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-base">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/60 mt-1">
              Start a conversation
            </p>
          </motion.div>
        )}

        {displayMessages.map((message, index) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              backgroundColor: highlightedMessageId === message._id ? "rgba(var(--p) / 0.2)" : "transparent",
            }}
            transition={{ delay: index * 0.02 }}
            ref={(el) => {
              messageRefs.current[message._id] = el;
              if (index === displayMessages.length - 1) {
                messageEndRef.current = el;
              }
            }}
            className={`rounded-lg transition-colors duration-300 ${
              highlightedMessageId === message._id ? "ring-2 ring-primary/50" : ""
            }`}
          >
            <MessageBubble
              message={message}
              isOwnMessage={message.senderId === authUser._id}
              authUser={authUser}
              selectedUser={selectedUser}
              onReply={setReplyToMessage}
              onForward={setForwardMessage}
              onDelete={deleteMessage}
              onEdit={editMessage}
              onStar={toggleStarMessage}
              isStarred={starredMessages.includes(message._id)}
              onReaction={handleReaction}
              onScrollToMessage={scrollToMessage}
              onScrollToTop={scrollToTop}
              reactions={getMessageReactions(message._id)}
              readReceipt={readReceipts[selectedUser._id]}
              playingAudio={playingAudio}
              onPlayAudio={handlePlayAudio}
              audioRef={(el) => { audioRefs.current[message._id] = el; }}
            />
          </motion.div>
        ))}

        {/* Display last call info */}
        {displayedCallInfo && (
          <CallMessage 
            callInfo={displayedCallInfo} 
            isOutgoing={displayedCallInfo.withUserId !== authUser._id} 
          />
        )}

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
                <div className="size-8 rounded-full">
                  <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="rounded-full object-cover" />
                </div>
              </div>
              <div className="chat-bubble bg-base-200 text-base-content py-2 px-3">
                <div className="flex gap-1 items-center">
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Spacer to prevent content from hiding behind fixed input */}
        <div className="h-4" ref={messageEndRef} />
      </div>

      {/* Fixed input at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-base-100 border-t border-base-200">
        <MessageInput />
      </div>

      {/* Forward modal */}
      <AnimatePresence>
        {forwardMessage && (
          <ForwardModal message={forwardMessage} onClose={() => setForwardMessage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
export default ChatContainer;
