import { create } from "zustand";
import Peer from "simple-peer";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// Audio context for ringtone
let audioContext = null;
let ringtoneOscillator = null;

const playRingtone = () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    ringtoneOscillator = oscillator;
    
    // Pulse effect
    const pulseRingtone = () => {
      if (!ringtoneOscillator) return;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      setTimeout(() => {
        if (ringtoneOscillator) {
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        }
      }, 1000);
    };
    
    pulseRingtone();
    const interval = setInterval(pulseRingtone, 2000);
    ringtoneOscillator._interval = interval;
  } catch (e) {
    console.log("Could not play ringtone:", e);
  }
};

const stopRingtone = () => {
  try {
    if (ringtoneOscillator) {
      clearInterval(ringtoneOscillator._interval);
      ringtoneOscillator.stop();
      ringtoneOscillator = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  } catch (e) {
    console.log("Error stopping ringtone:", e);
  }
};

// ICE servers for better connectivity
const getIceServers = () => [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

// Adaptive bitrate settings for low data mode
const getMediaConstraints = (callType, lowDataMode = false) => {
  if (callType === 'audio') {
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: lowDataMode ? 8000 : 48000,
      },
      video: false,
    };
  }

  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: lowDataMode
      ? {
          width: { ideal: 320, max: 480 },
          height: { ideal: 240, max: 360 },
          frameRate: { ideal: 15, max: 20 },
        }
      : {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
  };
};

export const useCallStore = create((set, get) => ({
  // Call state
  callStatus: "idle",
  callType: null,
  caller: null,
  receiver: null,
  localStream: null,
  remoteStream: null,
  peer: null,
  callStartTime: null,
  
  // Call controls
  isMuted: false,
  isVideoOff: false,
  isSpeakerOn: true,
  isOnHold: false,
  usingFrontCamera: true,
  lowDataMode: false,
  
  // Network quality
  networkQuality: "good",
  connectionStats: null,
  
  // Incoming call data
  incomingSignal: null,
  
  // Reconnection state
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  _monitorInterval: null,

  setLowDataMode: (enabled) => {
    set({ lowDataMode: enabled });
  },

  initiateCall: async (receiverUser, type) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const { lowDataMode } = get();
    
    if (!socket || !authUser) {
      toast.error("Not connected. Please try again.");
      return;
    }

    try {
      const constraints = getMediaConstraints(type, lowDataMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      set({
        callStatus: "calling",
        callType: type,
        receiver: receiverUser,
        localStream: stream,
        reconnectAttempts: 0,
      });

      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream: stream,
        config: { iceServers: getIceServers() },
      });

      peer.on("signal", (signalData) => {
        socket.emit("callUser", {
          userToCall: receiverUser._id,
          signalData,
          from: authUser._id,
          callerName: authUser.fullName,
          callerPic: authUser.profilePic,
          callType: type,
        });
      });

      peer.on("stream", (remoteStream) => {
        set({ remoteStream, networkQuality: "good" });
      });

      peer.on("connect", () => {
        set({ callStatus: "ongoing", callStartTime: Date.now(), networkQuality: "good" });
        get().startConnectionMonitor();
      });

      peer.on("close", () => {
        get().endCall();
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        if (get().callStatus === "ongoing") {
          get().attemptReconnect();
        } else {
          toast.error("Call connection failed");
          get().endCall();
        }
      });

      set({ peer });
      
      setTimeout(() => {
        if (get().callStatus === "calling") {
          toast.error("No answer");
          get().endCall();
        }
      }, 60000);
      
    } catch (error) {
      console.error("Failed to initiate call:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Camera/microphone permission denied");
      } else if (error.name === "NotFoundError") {
        toast.error("Camera/microphone not found");
      } else {
        toast.error("Could not access camera/microphone");
      }
      set({ callStatus: "idle", callType: null });
    }
  },

  handleIncomingCall: (data) => {
    playRingtone();
    set({
      callStatus: "receiving",
      callType: data.callType,
      caller: {
        _id: data.from,
        fullName: data.callerName,
        profilePic: data.callerPic,
      },
      incomingSignal: data.signal,
    });
  },

  acceptCall: async () => {
    const { callType, incomingSignal, caller, lowDataMode } = get();
    const socket = useAuthStore.getState().socket;
    
    stopRingtone();
    
    if (!socket || !incomingSignal) return;

    try {
      const constraints = getMediaConstraints(callType, lowDataMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      set({ 
        localStream: stream, 
        callStatus: "ongoing", 
        callStartTime: Date.now(),
        reconnectAttempts: 0,
      });

      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: { iceServers: getIceServers() },
      });

      peer.on("signal", (signalData) => {
        socket.emit("answerCall", { signal: signalData, to: caller._id });
      });

      peer.on("stream", (remoteStream) => {
        set({ remoteStream, networkQuality: "good" });
      });

      peer.on("connect", () => {
        set({ networkQuality: "good" });
        get().startConnectionMonitor();
      });

      peer.on("close", () => {
        get().endCall();
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        if (get().callStatus === "ongoing") {
          get().attemptReconnect();
        } else {
          toast.error("Call connection failed");
          get().endCall();
        }
      });

      peer.signal(incomingSignal);
      set({ peer });
    } catch (error) {
      console.error("Failed to accept call:", error);
      toast.error("Could not access camera/microphone");
      get().rejectCall();
    }
  },

  handleIceCandidate: (data) => {
    const { peer } = get();
    if (peer && data.candidate) {
      try {
        peer.signal({ candidate: data.candidate });
      } catch (e) {
        console.log("Error adding ICE candidate:", e);
      }
    }
  },

  handleCallAccepted: (signal) => {
    const { peer } = get();
    if (peer) {
      peer.signal(signal);
      set({ callStatus: "ongoing", callStartTime: Date.now() });
    }
  },

  attemptReconnect: async () => {
    const { reconnectAttempts, maxReconnectAttempts, callStatus } = get();
    
    if (reconnectAttempts >= maxReconnectAttempts) {
      toast.error("Connection lost. Call ended.");
      get().endCall();
      return;
    }

    if (callStatus !== "ongoing" && callStatus !== "reconnecting") return;

    set({ 
      callStatus: "reconnecting", 
      networkQuality: "reconnecting",
      reconnectAttempts: reconnectAttempts + 1 
    });
    
    toast.loading("Reconnecting... (" + (reconnectAttempts + 1) + "/" + maxReconnectAttempts + ")", {
      id: "reconnect-toast",
      duration: 3000,
    });

    setTimeout(() => {
      const { peer, callStatus: currentStatus } = get();
      if (currentStatus === "reconnecting" && peer?._pc?.iceConnectionState === "connected") {
        set({ callStatus: "ongoing", networkQuality: "good" });
        toast.success("Reconnected!", { id: "reconnect-toast" });
      }
    }, 3000);
  },

  startConnectionMonitor: () => {
    const { peer } = get();
    if (!peer || !peer._pc) return;

    const monitor = setInterval(async () => {
      try {
        const stats = await peer._pc.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;
        let bytesReceived = 0;
        let jitter = 0;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.mediaType === "video") {
            packetsLost = report.packetsLost || 0;
            packetsReceived = report.packetsReceived || 0;
            bytesReceived = report.bytesReceived || 0;
            jitter = report.jitter || 0;
          }
        });

        const totalPackets = packetsLost + packetsReceived;
        const lossRate = totalPackets > 0 ? packetsLost / totalPackets : 0;

        let quality = "good";
        if (lossRate > 0.1 || jitter > 0.1) {
          quality = "poor";
        } else if (lossRate > 0.03 || jitter > 0.05) {
          quality = "medium";
        }

        set({
          networkQuality: quality,
          connectionStats: { packetsLost, packetsReceived, bytesReceived, jitter, lossRate },
        });
      } catch (e) {}
    }, 2000);

    set({ _monitorInterval: monitor });
  },

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { caller } = get();
    
    stopRingtone();
    
    if (socket && caller) {
      socket.emit("rejectCall", { to: caller._id });
    }
    
    get().cleanupCall();
  },

  handleCallRejected: () => {
    toast.error("Call was declined");
    get().cleanupCall();
  },

  endCall: () => {
    const socket = useAuthStore.getState().socket;
    const { caller, receiver } = get();
    const otherUser = caller || receiver;
    
    stopRingtone();
    
    if (socket && otherUser) {
      socket.emit("endCall", { to: otherUser._id });
    }
    
    get().cleanupCall();
  },

  handleCallEnded: () => {
    stopRingtone();
    toast("Call ended", { icon: "📞" });
    get().cleanupCall();
  },

  handleCallFailed: (reason) => {
    stopRingtone();
    toast.error(reason || "Call failed");
    get().cleanupCall();
  },

  cleanupCall: () => {
    const { localStream, peer, _monitorInterval } = get();
    
    stopRingtone();
    
    if (_monitorInterval) {
      clearInterval(_monitorInterval);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peer) {
      peer.destroy();
    }
    
    set({
      callStatus: "idle",
      callType: null,
      caller: null,
      receiver: null,
      localStream: null,
      remoteStream: null,
      peer: null,
      callStartTime: null,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      isOnHold: false,
      incomingSignal: null,
      networkQuality: "good",
      connectionStats: null,
      reconnectAttempts: 0,
      _monitorInterval: null,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        set({ isMuted: !isMuted });
      }
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        set({ isVideoOff: !isVideoOff });
      }
    }
  },

  toggleSpeaker: () => {
    const { isSpeakerOn } = get();
    set({ isSpeakerOn: !isSpeakerOn });
    toast(isSpeakerOn ? "Speaker off" : "Speaker on", { icon: "🔊" });
  },

  toggleHold: () => {
    const { localStream, isOnHold } = get();
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.enabled = isOnHold;
      });
      set({ isOnHold: !isOnHold });
      toast(isOnHold ? "Call resumed" : "Call on hold", { icon: "⏸️" });
    }
  },

  switchCamera: async () => {
    const { localStream, usingFrontCamera, callType, lowDataMode, peer } = get();
    
    if (!localStream || callType !== "video") return;

    try {
      const currentVideoTrack = localStream.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
      }

      const constraints = {
        video: {
          facingMode: usingFrontCamera ? "environment" : "user",
          width: lowDataMode ? { ideal: 320 } : { ideal: 640 },
          height: lowDataMode ? { ideal: 240 } : { ideal: 480 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (peer && peer._pc) {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      localStream.removeTrack(currentVideoTrack);
      localStream.addTrack(newVideoTrack);

      set({ usingFrontCamera: !usingFrontCamera });
      toast("Switched to " + (usingFrontCamera ? "back" : "front") + " camera", { icon: "📷" });
    } catch (error) {
      console.error("Failed to switch camera:", error);
      toast.error("Could not switch camera");
    }
  },
}));
