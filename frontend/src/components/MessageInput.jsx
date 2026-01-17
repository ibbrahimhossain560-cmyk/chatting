import { useRef, useState, useEffect, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile, Paperclip, Camera, Mic, Reply } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, startTyping, stopTyping, replyToMessage, clearReplyToMessage } = useChatStore();

  // Handle typing indicator with debounce
  const handleTyping = useCallback(() => {
    startTyping();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [startTyping, stopTyping]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  // Focus input when replying
  useEffect(() => {
    if (replyToMessage) {
      inputRef.current?.focus();
    }
  }, [replyToMessage]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview) || isSending) return;

    setIsSending(true);
    stopTyping();
    
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoiceMessage = async (audioData, duration) => {
    setIsSending(true);
    try {
      await sendMessage({
        audio: audioData,
        audioDuration: duration,
        messageType: "audio",
      });
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error("Failed to send voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="p-2 sm:p-4 border-t border-base-300 bg-base-100/80 backdrop-blur-sm safe-area-bottom">
      {/* Reply preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 sm:mb-3 flex items-start gap-2 p-2 bg-base-200/80 rounded-xl border-l-4 border-primary"
          >
            <Reply className="size-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-primary">Replying to</span>
              <p className="text-sm truncate text-base-content/70">
                {replyToMessage.text || (replyToMessage.image ? "📷 Photo" : "🎤 Voice message")}
              </p>
            </div>
            <button
              onClick={clearReplyToMessage}
              className="btn btn-ghost btn-circle btn-xs"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 sm:mb-3"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-primary/30 shadow-lg"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-error text-error-content flex items-center justify-center shadow-lg"
                type="button"
              >
                <X className="size-3 sm:size-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recorder */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceRecorder
            onSend={handleSendVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}
      </AnimatePresence>

      {/* Input form - compact on mobile */}
      {!showVoiceRecorder && (
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
          {/* Attachment button - visible on mobile */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className={`btn btn-circle btn-sm sm:btn-md ${
              imagePreview ? "btn-primary" : "btn-ghost"
            } flex-shrink-0`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4 sm:size-5" />
          </motion.button>

          {/* Text input with emoji picker */}
          <div className="flex-1 relative">
            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="text"
              className="w-full input input-bordered input-sm sm:input-md rounded-full bg-base-200/50 focus:bg-base-100 focus:border-primary transition-all text-sm sm:text-base pl-3 sm:pl-4 pr-10 sm:pr-12"
              placeholder="Message..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
            
            {/* Emoji button inside input */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              data-emoji-trigger="true"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-xs ${
                showEmojiPicker ? "text-primary" : "text-base-content/50 hover:text-primary"
              }`}
            >
              <Smile className="size-4 sm:size-5" />
            </motion.button>
          </div>

          {/* Voice/Send button */}
          {text.trim() || imagePreview ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="btn btn-circle btn-sm sm:btn-md flex-shrink-0 btn-primary shadow-lg shadow-primary/30"
              disabled={isSending}
            >
              {isSending ? (
                <span className="loading loading-spinner loading-xs sm:loading-sm" />
              ) : (
                <Send className="size-4 sm:size-5" />
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="btn btn-circle btn-sm sm:btn-md flex-shrink-0 btn-ghost bg-base-200"
            >
              <Mic className="size-4 sm:size-5 text-base-content/50" />
            </motion.button>
          )}
        </form>
      )}
    </div>
  );
};
export default MessageInput;
