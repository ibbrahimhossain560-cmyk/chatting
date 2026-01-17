import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { notificationManager } from "../lib/notifications";
import { useNotificationStore } from "./useNotificationStore";
import { useCallStore } from "./useCallStore";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
      
      // Request notification permission when user is authenticated
      if (notificationManager.isSupported() && notificationManager.permission === 'default') {
        // Don't auto-request, let the banner handle it
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Listen for new messages globally (for notifications from any user)
    socket.on("newMessage", (newMessage) => {
      const { authUser } = get();
      const { notificationsEnabled, showSenderName, showMessagePreview } = useNotificationStore.getState();
      
      // Only show notification if message is for current user and notifications are enabled
      if (newMessage.receiverId === authUser._id && 
          notificationManager.isPermissionGranted() && 
          notificationsEnabled) {
        
        // Show notification for any new message received
        notificationManager.showMessageNotification(
          "Someone",
          newMessage,
          '/avatar.png',
          { showSenderName, showMessagePreview }
        );
      }
    });

    // ============ WebRTC Call Event Listeners ============

    // Handle incoming call
    socket.on("incomingCall", (data) => {
      useCallStore.getState().handleIncomingCall(data);
    });

    // Handle call accepted
    socket.on("callAccepted", (signal) => {
      useCallStore.getState().handleCallAccepted(signal);
    });

    // Handle call rejected
    socket.on("callRejected", () => {
      useCallStore.getState().handleCallRejected();
    });

    // Handle call ended
    socket.on("callEnded", () => {
      useCallStore.getState().handleCallEnded();
    });

    // Handle call failed (user offline)
    socket.on("callFailed", (data) => {
      toast.error(data.reason || "Call failed");
      useCallStore.getState().cleanupCall();
    });

    // ============ End WebRTC Call Event Listeners ============
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));