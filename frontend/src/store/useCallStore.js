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

// Store granted permission state
let hasGrantedAudioPermission = false;
let hasGrantedVideoPermission = false;
let cachedAudioStream = null;
let cachedVideoStream = null;

// Simple media stream getter - works after permission granted once
const getMediaStream = async (wantVideo = false) => {
  console.log("getMediaStream called, wantVideo:", wantVideo);
  
  // Check if mediaDevices API exists
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { stream: null, error: "Browser doesn't support media devices" };
  }

  try {
    // Simple approach - just request what we need
    const constraints = {
      audio: true,
      video: wantVideo
    };
    
    console.log("Requesting media with:", constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Got stream with tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
    
    // Mark permissions as granted
    hasGrantedAudioPermission = true;
    if (wantVideo) hasGrantedVideoPermission = true;
    
    return { stream, error: null };
  } catch (err) {
    console.error("getUserMedia error:", err.name, err.message);
    
    // If video failed, try audio only
    if (wantVideo) {
      console.log("Video failed, trying audio only...");
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        hasGrantedAudioPermission = true;
        return { stream: audioStream, error: null, audioOnly: true };
      } catch (audioErr) {
        console.error("Audio only also failed:", audioErr.name);
      }
    }
    
    // Return appropriate error message
    let errorMessage = "Could not access media devices";
    
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      errorMessage = "Please allow camera/microphone access. Click the camera icon in your browser's address bar, then refresh the page.";
    } else if (err.name === "NotFoundError") {
      errorMessage = "No camera/microphone found on this device.";
    } else if (err.name === "NotReadableError") {
      errorMessage = "Camera/microphone is being used by another app. Close other apps and try again.";
    } else if (err.name === "OverconstrainedError") {
      errorMessage = "Device doesn't support the requested settings.";
    }
    
    return { stream: null, error: errorMessage };
  }
};

export const useCallStore = create((set, get) => ({
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
  usingFrontCamera: true,
  lowDataMode: false,
  networkQuality: "good",
  connectionStats: null,
  incomingSignal: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  _monitorInterval: null,

  setLowDataMode: (enabled) => set({ lowDataMode: enabled }),

  initiateCall: async (receiverUser, type) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    
    if (!socket || !authUser) {
      toast.error("Not connected. Please refresh and try again.");
      return;
    }

    const isVideoCall = type === 'video';
    let actualCallType = type;
    
    // Show loading toast
    const loadingToast = toast.loading("Setting up call...");
    
    try {
      // Get media stream
      const result = await getMediaStream(isVideoCall);
      
      toast.dismiss(loadingToast);
      
      if (!result.stream) {
        toast.error(result.error || "Could not access microphone");
        return;
      }
      
      // If we got audio only for a video call
      if (result.audioOnly && isVideoCall) {
        toast("Camera unavailable, using audio only", { icon: "🎤" });
        actualCallType = 'audio';
      }
      
      const stream = result.stream;
      console.log("Call starting with stream tracks:", stream.getTracks().map(t => t.kind));
      
      set({
        callStatus: "calling",
        callType: actualCallType,
        receiver: receiverUser,
        localStream: stream,
        reconnectAttempts: 0,
        isVideoOff: actualCallType === 'audio',
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
          callType: actualCallType,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("Received remote stream");
        set({ remoteStream, networkQuality: "good" });
      });

      peer.on("connect", () => {
        console.log("Peer connected");
        set({ callStatus: "ongoing", callStartTime: Date.now(), networkQuality: "good" });
        get().startConnectionMonitor();
      });

      peer.on("close", () => {
        console.log("Peer closed");
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
      
      // Timeout for unanswered calls
      setTimeout(() => {
        if (get().callStatus === "calling") {
          toast.error("Call not answered");
          get().endCall();
        }
      }, 45000);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Call initiation error:", error);
      toast.error("Failed to start call. Please try again.");
    }
  },

  answerCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingSignal, caller, callType } = get();
    
    if (!socket || !incomingSignal || !caller) {
      toast.error("Call data missing. Please try again.");
      return;
    }

    stopRingtone();
    
    const isVideoCall = callType === 'video';
    let actualCallType = callType;
    
    const loadingToast = toast.loading("Connecting...");
    
    try {
      const result = await getMediaStream(isVideoCall);
      
      toast.dismiss(loadingToast);
      
      if (!result.stream) {
        toast.error(result.error || "Could not access microphone");
        get().rejectCall();
        return;
      }
      
      if (result.audioOnly && isVideoCall) {
        toast("Camera unavailable, using audio only", { icon: "🎤" });
        actualCallType = 'audio';
      }
      
      const stream = result.stream;
      
      set({
        callStatus: "ongoing",
        callType: actualCallType,
        localStream: stream,
        callStartTime: Date.now(),
        isVideoOff: actualCallType === 'audio',
      });

      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: { iceServers: getIceServers() },
      });

      peer.on("signal", (signalData) => {
        socket.emit("answerCall", {
          signal: signalData,
          to: caller._id,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("Answer: Received remote stream");
        set({ remoteStream });
      });

      peer.on("connect", () => {
        console.log("Answer: Peer connected");
        get().startConnectionMonitor();
      });

      peer.on("close", () => get().endCall());
      
      peer.on("error", (err) => {
        console.error("Answer peer error:", err);
        if (get().callStatus === "ongoing") {
          get().attemptReconnect();
        } else {
          toast.error("Connection failed");
          get().endCall();
        }
      });

      peer.signal(incomingSignal);
      set({ peer });
      
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Answer call error:", error);
      toast.error("Failed to answer call");
      get().rejectCall();
    }
  },

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { caller } = get();
    
    stopRingtone();
    
    if (socket && caller) {
      socket.emit("rejectCall", { to: caller._id });
    }
    
    set({
      callStatus: "idle",
      caller: null,
      incomingSignal: null,
      callType: null,
    });
  },

  endCall: () => {
    const socket = useAuthStore.getState().socket;
    const { peer, localStream, receiver, caller, _monitorInterval } = get();
    
    stopRingtone();
    
    if (_monitorInterval) {
      clearInterval(_monitorInterval);
    }
    
    if (peer) {
      peer.destroy();
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
    }
    
    const otherUser = receiver || caller;
    if (socket && otherUser) {
      socket.emit("endCall", { to: otherUser._id });
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
      incomingSignal: null,
      isMuted: false,
      isVideoOff: false,
      isOnHold: false,
      reconnectAttempts: 0,
      _monitorInterval: null,
    });
  },

  receiveCall: (callData) => {
    playRingtone();
    
    set({
      callStatus: "receiving",
      caller: {
        _id: callData.from,
        fullName: callData.callerName,
        profilePic: callData.callerPic,
      },
      incomingSignal: callData.signalData,
      callType: callData.callType,
    });
    
    // Auto-reject after 60 seconds
    setTimeout(() => {
      if (get().callStatus === "receiving") {
        get().rejectCall();
        toast("Missed call from " + callData.callerName, { icon: "📞" });
      }
    }, 60000);
  },

  handleCallAccepted: (signal) => {
    const { peer } = get();
    if (peer) {
      peer.signal(signal);
    }
  },

  handleCallEnded: () => {
    get().endCall();
    toast("Call ended", { icon: "📞" });
  },

  handleCallRejected: () => {
    get().endCall();
    toast("Call was declined", { icon: "📞" });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff, callType } = get();
    if (callType === 'audio') {
      toast("Video not available in audio call");
      return;
    }
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      set({ isVideoOff: !isVideoOff });
    }
  },

  toggleSpeaker: () => {
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn }));
  },

  toggleHold: () => {
    const { localStream, isOnHold } = get();
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.enabled = isOnHold;
      });
      set({ isOnHold: !isOnHold });
    }
  },

  switchCamera: async () => {
    const { localStream, usingFrontCamera, peer } = get();
    if (!localStream) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: usingFrontCamera ? 'environment' : 'user' },
        audio: true,
      });

      const oldVideoTrack = localStream.getVideoTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (peer && oldVideoTrack && newVideoTrack) {
        peer.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
      }

      oldVideoTrack?.stop();
      
      localStream.removeTrack(oldVideoTrack);
      localStream.addTrack(newVideoTrack);

      set({ usingFrontCamera: !usingFrontCamera });
    } catch (error) {
      console.error("Failed to switch camera:", error);
      toast.error("Could not switch camera");
    }
  },

  startConnectionMonitor: () => {
    const interval = setInterval(() => {
      const { peer } = get();
      if (peer && peer._pc) {
        peer._pc.getStats().then(stats => {
          let packetsLost = 0;
          let packetsReceived = 0;
          
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              packetsLost += report.packetsLost || 0;
              packetsReceived += report.packetsReceived || 0;
            }
          });
          
          const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
          
          let quality = "good";
          if (lossRate > 0.1) quality = "poor";
          else if (lossRate > 0.05) quality = "fair";
          
          set({ networkQuality: quality, connectionStats: { packetsLost, packetsReceived, lossRate } });
        }).catch(() => {});
      }
    }, 3000);
    
    set({ _monitorInterval: interval });
  },

  attemptReconnect: async () => {
    const { reconnectAttempts, maxReconnectAttempts, receiver, callType } = get();
    
    if (reconnectAttempts >= maxReconnectAttempts) {
      toast.error("Connection lost. Please try calling again.");
      get().endCall();
      return;
    }
    
    set({ reconnectAttempts: reconnectAttempts + 1, networkQuality: "reconnecting" });
    toast.loading(`Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (receiver && callType) {
      get().endCall();
      setTimeout(() => {
        get().initiateCall(receiver, callType);
      }, 1000);
    }
  },
}));
