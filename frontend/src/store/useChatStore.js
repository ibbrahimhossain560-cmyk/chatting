import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { notificationManager } from "../lib/notifications";
import { useNotificationStore } from "./useNotificationStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  
  // Typing indicator
  typingUsers: {}, // { oderId: boolean }
  
  // Read receipts
  readReceipts: {}, // { oderId: lastReadTimestamp }
  
  // Message reactions
  messageReactions: {}, // { messageId: [{ userId, emoji }] }
  
  // Reply to message
  replyToMessage: null,
  
  // Last seen times
  userLastSeen: {}, // { oderId: Date }
  
  // Starred messages
  starredMessages: [], // [messageIds]
  
  // Search
  searchQuery: "",
  searchResults: [],

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      
      // Mark messages as read
      get().markMessagesAsRead(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyToMessage } = get();
    try {
      const payload = {
        ...messageData,
        replyTo: replyToMessage?._id,
      };
      
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set({ 
        messages: [...messages, res.data],
        replyToMessage: null, // Clear reply after sending
      });
      
      // Stop typing indicator when message sent
      get().stopTyping();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ============ Reply to Message ============
  
  setReplyToMessage: (message) => {
    set({ replyToMessage: message });
  },
  
  clearReplyToMessage: () => {
    set({ replyToMessage: null });
  },

  // ============ Delete Message ============
  
  deleteMessage: async (messageId, deleteForEveryone = false) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, {
        data: { deleteForEveryone },
      });
      
      if (deleteForEveryone) {
        // Update message locally
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, deletedForEveryone: true, text: "This message was deleted", image: null, audio: null }
              : m
          ),
        }));
      } else {
        // Remove from local state
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== messageId),
        }));
      }
      
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  // ============ Star Message ============
  
  toggleStarMessage: async (messageId) => {
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/star`);
      
      set((state) => ({
        starredMessages: res.data.starred
          ? [...state.starredMessages, messageId]
          : state.starredMessages.filter((id) => id !== messageId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to star message");
    }
  },

  // ============ Forward Message ============
  
  forwardMessage: async (messageId, receiverIds) => {
    try {
      await axiosInstance.post(`/messages/${messageId}/forward`, { receiverIds });
      toast.success(`Message forwarded to ${receiverIds.length} user(s)`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to forward message");
    }
  },

  // ============ Search Messages ============
  
  setSearchQuery: (query) => {
    const { messages } = get();
    const results = query
      ? messages.filter((m) => m.text?.toLowerCase().includes(query.toLowerCase()))
      : [];
    set({ searchQuery: query, searchResults: results });
  },
  
  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },

  // ============ Typing Indicator ============
  
  startTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    socket?.emit("typing", { receiverId: selectedUser._id });
  },

  stopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    socket?.emit("stopTyping", { receiverId: selectedUser._id });
  },

  setUserTyping: (userId, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping,
      },
    }));
  },

  // ============ Read Receipts ============
  
  markMessagesAsRead: (senderId) => {
    const socket = useAuthStore.getState().socket;
    socket?.emit("messagesRead", { senderId });
  },

  setMessagesRead: (userId) => {
    set((state) => ({
      readReceipts: {
        ...state.readReceipts,
        [userId]: new Date(),
      },
    }));
  },

  // ============ Last Seen ============
  
  setUserLastSeen: (userId, lastSeen) => {
    set((state) => ({
      userLastSeen: {
        ...state.userLastSeen,
        [userId]: lastSeen,
      },
    }));
  },

  // ============ Message Reactions ============
  
  addReaction: async (messageId, emoji) => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/reaction`, { emoji });
      
      set((state) => ({
        messageReactions: {
          ...state.messageReactions,
          [messageId]: res.data,
        },
      }));
    } catch (error) {
      // Fallback to socket if API fails
      const socket = useAuthStore.getState().socket;
      socket?.emit("addReaction", { 
        messageId, 
        reaction: emoji,
        receiverId: selectedUser._id,
      });
    }
  },

  setMessageReaction: (messageId, reactions) => {
    set((state) => ({
      messageReactions: {
        ...state.messageReactions,
        [messageId]: reactions,
      },
    }));
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Show notification for messages from selected user
      const { notificationsEnabled, showSenderName, showMessagePreview } = useNotificationStore.getState();
      
      if (notificationManager.isPermissionGranted() && notificationsEnabled) {
        const { users } = get();
        const sender = users.find(user => user._id === newMessage.senderId);
        if (sender) {
          notificationManager.showMessageNotification(
            sender.fullName,
            newMessage,
            sender.profilePic,
            { showSenderName, showMessagePreview }
          );
        }
      }

      set({
        messages: [...get().messages, newMessage],
      });
      
      // Auto mark as read since user is viewing the conversation
      get().markMessagesAsRead(selectedUser._id);
    });

    // Listen for typing indicators
    socket.on("userTyping", (data) => {
      if (data.senderId === selectedUser._id) {
        get().setUserTyping(data.senderId, data.isTyping);
      }
    });

    // Listen for read receipts
    socket.on("allMessagesRead", (data) => {
      get().setMessagesRead(data.readBy);
    });

    // Listen for reactions
    socket.on("messageReaction", (data) => {
      get().setMessageReaction(data.messageId, data.reactions);
    });

    // Listen for message deletions
    socket.on("messageDeleted", (data) => {
      if (data.deletedForEveryone) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === data.messageId
              ? { ...m, deletedForEveryone: true, text: "This message was deleted", image: null, audio: null }
              : m
          ),
        }));
      }
    });

    // Listen for last seen updates
    socket.on("userLastSeen", (data) => {
      get().setUserLastSeen(data.userId, data.lastSeen);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("allMessagesRead");
    socket.off("messageReaction");
    socket.off("messageDeleted");
    socket.off("userLastSeen");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));