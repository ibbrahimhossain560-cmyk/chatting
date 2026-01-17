import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// Audio context for ringtone
let audioContext = null;
let ringtoneOscillator = null;

const playRingtone = () => {
  try {
    if (ringtoneOscillator) return; // Already playing
    
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

// ICE servers for better connectivity - using reliable public servers
const getIceServers = () => [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Free TURN servers for NAT traversal
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
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

// Get media stream with permission request
const getMediaStream = async (wantVideo = false) => {
  console.log("getMediaStream called, wantVideo:", wantVideo);
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { stream: null, error: "Browser doesn't support media devices", permissionDenied: false };
  }

  try {
    const constraints = { 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }, 
      video: wantVideo ? {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user',
      } : false 
    };
    console.log("Requesting media with:", constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Got stream with tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
    return { stream, error: null, permissionDenied: false };
  } catch (err) {
    console.error("getUserMedia error:", err.name, err.message);
    
    const isPermissionDenied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
    
    // If video failed due to permission, try audio only
    if (wantVideo && isPermissionDenied) {
      console.log("Video permission denied, trying audio only...");
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false 
        });
        return { stream: audioStream, error: null, audioOnly: true, videoPermissionDenied: true, permissionDenied: false };
      } catch (audioErr) {
        console.error("Audio only also failed:", audioErr.name);
        return { 
          stream: null, 
          error: "Microphone access denied. Please allow microphone access in your browser settings.", 
          permissionDenied: true 
        };
      }
    }
    
    // If video failed for other reasons, try audio only
    if (wantVideo) {
      console.log("Video failed, trying audio only...");
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false 
        });
        return { stream: audioStream, error: null, audioOnly: true, permissionDenied: false };
      } catch (audioErr) {
        console.error("Audio only also failed:", audioErr.name);
      }
    }
    
    let errorMessage = "Could not access media devices";
    
    if (isPermissionDenied) {
      errorMessage = wantVideo 
        ? "Camera/Microphone access denied. Please allow access in your browser settings."
        : "Microphone access denied. Please allow access in your browser settings.";
      return { stream: null, error: errorMessage, permissionDenied: true };
    } else if (err.name === "NotFoundError") {
      errorMessage = "No camera/microphone found";
    } else if (err.name === "NotReadableError") {
      errorMessage = "Camera/microphone is being used by another app";
    }
    
    return { stream: null, error: errorMessage, permissionDenied: false };
  }
};

// Format duration for display
export const formatCallDuration = (seconds) => {
  if (!seconds || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

// Dynamically import simple-peer to avoid SSR issues
let SimplePeer = null;
const loadSimplePeer = async () => {
  if (SimplePeer) return SimplePeer;
  try {
    const module = await import('simple-peer');
    SimplePeer = module.default || module;
    console.log("SimplePeer loaded successfully");
    return SimplePeer;
  } catch (err) {
    console.error("Failed to load simple-peer:", err);
    return null;
  }
};

export const useCallStore = create(
  persist(
    (set, get) => ({
      // Call state
      callStatus: "idle", // idle, calling, receiving, connecting, ongoing, reconnecting
      callType: null, // 'audio' or 'video'
      caller: null,
      receiver: null,
      
      // Streams
      localStream: null,
      remoteStream: null,
      
      // Peer connection
      peer: null,
      
      // Call timing
      callStartTime: null,
      
      // UI state
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      isOnHold: false,
      usingFrontCamera: true,
      lowDataMode: false,
      networkQuality: "good",
      
      // Signaling
      incomingSignal: null,
      pendingCandidates: [], // Store ICE candidates that arrive before peer is ready
      
      // Reconnection
      reconnectAttempts: 0,
      maxReconnectAttempts: 3,
      
      // Permission state
      permissionDenied: false,
      permissionType: null,
      
      // Internal
      _monitorInterval: null,
      _callTimeout: null,
      
      // Persistent data
      lastCallInfo: null,
      callHistory: [],

      // ============ Helper Methods ============
      
      setLowDataMode: (enabled) => set({ lowDataMode: enabled }),
      
      addCallToHistory: (callInfo) => {
        const { callHistory } = get();
        const newHistory = [
          { ...callInfo, id: Date.now() },
          ...callHistory
        ].slice(0, 50);
        set({ callHistory: newHistory });
      },
      
      clearCallHistory: () => set({ callHistory: [] }),
      clearLastCallInfo: () => set({ lastCallInfo: null }),
      clearPermissionDenied: () => set({ permissionDenied: false, permissionType: null }),

      // ============ Socket Event Handlers ============

      handleIncomingCall: (data) => {
        const { callStatus } = get();
        
        // Reject if already in a call
        if (callStatus !== "idle") {
          console.log("Already in call, rejecting incoming call");
          const socket = useAuthStore.getState().socket;
          if (socket) {
            socket.emit("rejectCall", { to: data.from });
          }
          return;
        }
        
        console.log("📞 Incoming call received:", data);
        playRingtone();
        
        set({
          callStatus: "receiving",
          caller: {
            _id: data.from,
            fullName: data.callerName,
            profilePic: data.callerPic,
          },
          incomingSignal: data.signal,
          callType: data.callType,
          pendingCandidates: [],
        });
        
        // Auto-reject after 45 seconds
        const timeout = setTimeout(() => {
          if (get().callStatus === "receiving") {
            console.log("Call timeout - auto rejecting");
            get().rejectCall();
            toast("Missed call from " + data.callerName, { icon: "📞" });
          }
        }, 45000);
        
        set({ _callTimeout: timeout });
      },

      handleCallAccepted: (signal) => {
        console.log("✅ Call accepted by receiver, signaling peer");
        const { peer, callStatus, _callTimeout } = get();
        
        // Clear timeout
        if (_callTimeout) {
          clearTimeout(_callTimeout);
          set({ _callTimeout: null });
        }
        
        stopRingtone();
        
        if (!peer) {
          console.error("❌ No peer available to signal");
          toast.error("Call connection failed - no peer");
          get().cleanupCall();
          return;
        }
        
        if (callStatus !== "calling") {
          console.log("Call status changed, ignoring signal");
          return;
        }
        
        try {
          // Update status immediately to show user the call was answered
          set({ callStatus: "connecting" });
          console.log("📡 Signaling peer with answer...");
          
          // Signal the peer with the answer
          peer.signal(signal);
          
        } catch (e) {
          console.error("❌ Error signaling peer:", e);
          toast.error("Failed to connect call");
          get().cleanupCall();
        }
      },

      handleCallRejected: () => {
        console.log("❌ Call was rejected by receiver");
        const { _callTimeout } = get();
        
        if (_callTimeout) {
          clearTimeout(_callTimeout);
        }
        
        stopRingtone();
        toast("Call was declined", { icon: "📞" });
        get().cleanupCall();
      },

      handleCallEnded: () => {
        console.log("📞 Call ended by other party");
        const { _callTimeout } = get();
        
        if (_callTimeout) {
          clearTimeout(_callTimeout);
        }
        
        stopRingtone();
        toast("Call ended", { icon: "📞" });
        get().cleanupCall();
      },

      // ============ Call Actions ============

      initiateCall: async (receiverUser, type) => {
        const socket = useAuthStore.getState().socket;
        const authUser = useAuthStore.getState().authUser;
        
        if (!socket?.connected) {
          toast.error("Not connected to server. Please refresh.");
          return;
        }
        
        if (!authUser) {
          toast.error("Please log in to make calls.");
          return;
        }

        const { callStatus } = get();
        if (callStatus !== "idle") {
          toast.error("Already in a call");
          return;
        }

        const isVideoCall = type === 'video';
        let actualCallType = type;
        
        console.log(`📞 Initiating ${type} call to:`, receiverUser.fullName);
        
        const loadingToast = toast.loading("Setting up call...");
        
        try {
          // Load simple-peer
          const Peer = await loadSimplePeer();
          if (!Peer) {
            toast.dismiss(loadingToast);
            toast.error("Call module not available. Please refresh.");
            return;
          }

          // Get media stream
          const result = await getMediaStream(isVideoCall);
          toast.dismiss(loadingToast);
          
          if (!result.stream) {
            if (result.permissionDenied) {
              set({ permissionDenied: true, permissionType: isVideoCall ? "camera" : "microphone" });
              toast.error(result.error || "Permission denied");
            } else {
              toast.error(result.error || "Could not access microphone");
            }
            return;
          }
          
          // Handle video fallback
          if (result.videoPermissionDenied && isVideoCall) {
            toast("Camera access denied. Using audio only.", { icon: "🎤" });
            actualCallType = 'audio';
          } else if (result.audioOnly && isVideoCall) {
            toast("Camera unavailable, using audio only", { icon: "🎤" });
            actualCallType = 'audio';
          }
          
          const stream = result.stream;
          console.log("📹 Got local stream:", stream.getTracks().map(t => t.kind));
          
          // Update state before creating peer
          set({
            callStatus: "calling",
            callType: actualCallType,
            receiver: receiverUser,
            localStream: stream,
            reconnectAttempts: 0,
            isVideoOff: actualCallType === 'audio',
            permissionDenied: false,
            permissionType: null,
          });

          // Create initiator peer
          console.log("🔗 Creating peer connection (initiator)...");
          const peer = new Peer({
            initiator: true,
            trickle: false, // Wait for all ICE candidates before signaling
            stream: stream,
            config: { 
              iceServers: getIceServers(),
              iceTransportPolicy: 'all',
            },
          });

          // Signal event - send offer to receiver
          peer.on("signal", (signalData) => {
            console.log("📤 Sending call signal to:", receiverUser._id);
            socket.emit("callUser", {
              userToCall: receiverUser._id,
              signalData,
              from: authUser._id,
              callerName: authUser.fullName,
              callerPic: authUser.profilePic,
              callType: actualCallType,
            });
          });

          // Remote stream received
          peer.on("stream", (remoteStream) => {
            console.log("📥 Received remote stream:", remoteStream.getTracks().map(t => t.kind));
            set({ remoteStream, networkQuality: "good" });
          });

          // Peer connected - call is now active
          peer.on("connect", () => {
            console.log("🎉 Peer connected! Call is now ongoing.");
            set({ 
              callStatus: "ongoing", 
              callStartTime: Date.now(), 
              networkQuality: "good" 
            });
            get().startConnectionMonitor();
          });

          // Peer closed
          peer.on("close", () => {
            console.log("🔌 Peer connection closed");
            if (get().callStatus !== "idle") {
              get().endCall();
            }
          });

          // Peer error
          peer.on("error", (err) => {
            console.error("❌ Peer error:", err.message);
            const status = get().callStatus;
            
            if (status === "ongoing" || status === "connecting") {
              // Try to reconnect for established calls
              get().attemptReconnect();
            } else {
              toast.error("Connection failed: " + err.message);
              get().cleanupCall();
            }
          });

          set({ peer });
          
          // Set timeout for unanswered call
          const callTimeout = setTimeout(() => {
            if (get().callStatus === "calling") {
              console.log("⏰ Call timeout - not answered");
              toast.error("Call not answered");
              get().endCall();
            }
          }, 45000);
          
          set({ _callTimeout: callTimeout });
          
        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("❌ Call initiation error:", error);
          toast.error("Failed to start call");
          get().cleanupCall();
        }
      },

      acceptCall: async () => {
        const socket = useAuthStore.getState().socket;
        const { incomingSignal, caller, callType, _callTimeout } = get();
        
        if (!socket?.connected) {
          toast.error("Not connected to server");
          return;
        }
        
        if (!incomingSignal || !caller) {
          toast.error("Call data missing");
          get().cleanupCall();
          return;
        }

        // Clear auto-reject timeout
        if (_callTimeout) {
          clearTimeout(_callTimeout);
          set({ _callTimeout: null });
        }

        stopRingtone();
        
        const isVideoCall = callType === 'video';
        let actualCallType = callType;
        
        console.log(`📞 Accepting ${callType} call from:`, caller.fullName);
        
        const loadingToast = toast.loading("Connecting...");
        
        try {
          // Load simple-peer
          const Peer = await loadSimplePeer();
          if (!Peer) {
            toast.dismiss(loadingToast);
            toast.error("Call module not available");
            get().rejectCall();
            return;
          }

          // Get media stream
          const result = await getMediaStream(isVideoCall);
          toast.dismiss(loadingToast);
          
          if (!result.stream) {
            if (result.permissionDenied) {
              set({ 
                permissionDenied: true, 
                permissionType: isVideoCall ? "camera" : "microphone",
                callStatus: "receiving", // Stay in receiving to show permission UI
              });
              toast.error("Please allow microphone access and try again");
              return;
            }
            toast.error(result.error || "Could not access microphone");
            get().rejectCall();
            return;
          }
          
          // Handle video fallback
          if (result.videoPermissionDenied && isVideoCall) {
            toast("Camera access denied. Using audio only.", { icon: "🎤" });
            actualCallType = 'audio';
          } else if (result.audioOnly && isVideoCall) {
            toast("Camera unavailable, using audio only", { icon: "🎤" });
            actualCallType = 'audio';
          }
          
          const stream = result.stream;
          console.log("📹 Got local stream:", stream.getTracks().map(t => t.kind));
          
          // Update state
          set({
            callStatus: "connecting",
            callType: actualCallType,
            localStream: stream,
            isVideoOff: actualCallType === 'audio',
            permissionDenied: false,
            permissionType: null,
          });

          // Create answering peer
          console.log("🔗 Creating peer connection (answerer)...");
          const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
            config: { 
              iceServers: getIceServers(),
              iceTransportPolicy: 'all',
            },
          });

          // Signal event - send answer to caller
          peer.on("signal", (signalData) => {
            console.log("📤 Sending answer signal to:", caller._id);
            socket.emit("answerCall", {
              signal: signalData,
              to: caller._id,
            });
          });

          // Remote stream received
          peer.on("stream", (remoteStream) => {
            console.log("📥 Received remote stream:", remoteStream.getTracks().map(t => t.kind));
            set({ remoteStream });
          });

          // Peer connected
          peer.on("connect", () => {
            console.log("🎉 Peer connected! Call is now ongoing.");
            set({ 
              callStatus: "ongoing", 
              callStartTime: Date.now(),
              networkQuality: "good" 
            });
            get().startConnectionMonitor();
          });

          // Peer closed
          peer.on("close", () => {
            console.log("🔌 Peer connection closed");
            if (get().callStatus !== "idle") {
              get().endCall();
            }
          });

          // Peer error
          peer.on("error", (err) => {
            console.error("❌ Peer error:", err.message);
            const status = get().callStatus;
            
            if (status === "ongoing" || status === "connecting") {
              get().attemptReconnect();
            } else {
              toast.error("Connection failed");
              get().cleanupCall();
            }
          });

          // Signal with incoming offer
          console.log("📡 Signaling peer with incoming offer...");
          peer.signal(incomingSignal);
          
          set({ peer });
          
        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("❌ Accept call error:", error);
          toast.error("Failed to answer call");
          get().rejectCall();
        }
      },

      rejectCall: () => {
        const socket = useAuthStore.getState().socket;
        const { caller, _callTimeout } = get();
        
        console.log("❌ Rejecting call");
        
        if (_callTimeout) {
          clearTimeout(_callTimeout);
        }
        
        stopRingtone();
        
        if (socket?.connected && caller) {
          socket.emit("rejectCall", { to: caller._id });
        }
        
        get().cleanupCall();
      },

      endCall: () => {
        const socket = useAuthStore.getState().socket;
        const { peer, localStream, receiver, caller, _monitorInterval, _callTimeout, callStartTime, callType } = get();
        
        console.log("📞 Ending call");
        
        stopRingtone();
        
        // Clear timers
        if (_callTimeout) {
          clearTimeout(_callTimeout);
        }
        if (_monitorInterval) {
          clearInterval(_monitorInterval);
        }
        
        // Calculate call duration
        let callDuration = 0;
        if (callStartTime) {
          callDuration = Math.floor((Date.now() - callStartTime) / 1000);
        }
        
        const otherUser = receiver || caller;
        
        // Save call to history
        if (otherUser) {
          const callInfo = {
            duration: callDuration,
            type: callType,
            endedAt: new Date().toISOString(),
            withUserId: otherUser._id,
            withUserName: otherUser.fullName,
            withUserPic: otherUser.profilePic,
            wasCaller: !!receiver,
          };
          set({ lastCallInfo: callInfo });
          
          if (callDuration > 0) {
            get().addCallToHistory(callInfo);
          }
        }
        
        // Destroy peer
        if (peer) {
          try {
            peer.destroy();
          } catch (e) {
            console.log("Error destroying peer:", e);
          }
        }
        
        // Stop local tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (e) {
              console.log("Error stopping track:", e);
            }
          });
        }
        
        // Notify other party
        if (socket?.connected && otherUser) {
          socket.emit("endCall", { to: otherUser._id });
        }
        
        // Reset state
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
          permissionDenied: false,
          permissionType: null,
          pendingCandidates: [],
          _monitorInterval: null,
          _callTimeout: null,
        });
      },

      // ============ Call Controls ============

      toggleMute: () => {
        const { localStream, isMuted } = get();
        if (localStream) {
          localStream.getAudioTracks().forEach(track => {
            track.enabled = isMuted; // Toggle: if muted, enable; if unmuted, disable
          });
          set({ isMuted: !isMuted });
          console.log(isMuted ? "🔊 Unmuted" : "🔇 Muted");
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
          console.log(isVideoOff ? "📹 Video on" : "📹 Video off");
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
          console.log(isOnHold ? "▶️ Resumed" : "⏸️ On hold");
        }
      },

      switchCamera: async () => {
        const { localStream, usingFrontCamera, peer, isVideoOff } = get();
        if (!localStream) {
          toast.error("No video stream");
          return;
        }

        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (!currentVideoTrack) {
          toast.error("No video track");
          return;
        }

        try {
          currentVideoTrack.stop();
          
          const newFacingMode = usingFrontCamera ? 'environment' : 'user';
          
          let newStream;
          try {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { exact: newFacingMode } },
              audio: false,
            });
          } catch {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: newFacingMode } },
              audio: false,
            });
          }

          const newVideoTrack = newStream.getVideoTracks()[0];
          if (!newVideoTrack) {
            toast.error("Could not get new camera");
            return;
          }

          // Replace track in peer connection
          if (peer?._pc) {
            const senders = peer._pc.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack);
            }
          }

          localStream.removeTrack(currentVideoTrack);
          localStream.addTrack(newVideoTrack);
          
          if (isVideoOff) {
            newVideoTrack.enabled = false;
          }

          set({ usingFrontCamera: !usingFrontCamera });
          toast.success(`Switched to ${!usingFrontCamera ? 'front' : 'back'} camera`);
        } catch (error) {
          console.error("Camera switch error:", error);
          toast.error("Could not switch camera");
        }
      },

      // ============ Connection Monitoring ============

      startConnectionMonitor: () => {
        const interval = setInterval(() => {
          const { peer } = get();
          if (peer?._pc) {
            peer._pc.getStats().then(stats => {
              let packetsLost = 0;
              let packetsReceived = 0;
              
              stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                  packetsLost += report.packetsLost || 0;
                  packetsReceived += report.packetsReceived || 0;
                }
              });
              
              const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
              
              let quality = "good";
              if (lossRate > 0.1) quality = "poor";
              else if (lossRate > 0.05) quality = "medium";
              
              set({ networkQuality: quality });
            }).catch(() => {});
          }
        }, 3000);
        
        set({ _monitorInterval: interval });
      },

      attemptReconnect: async () => {
        const { reconnectAttempts, maxReconnectAttempts } = get();
        
        if (reconnectAttempts >= maxReconnectAttempts) {
          toast.error("Connection lost");
          get().endCall();
          return;
        }
        
        set({ reconnectAttempts: reconnectAttempts + 1, networkQuality: "reconnecting" });
        toast.loading(`Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // If still having issues, end call
        if (get().networkQuality === "reconnecting") {
          toast.error("Could not reconnect");
          get().endCall();
        }
      },
      
      retryAcceptCall: async () => {
        set({ permissionDenied: false, permissionType: null });
        await get().acceptCall();
      },
      
      cleanupCall: () => {
        const { peer, localStream, _monitorInterval, _callTimeout } = get();
        
        console.log("🧹 Cleaning up call state");
        
        stopRingtone();
        
        if (_callTimeout) {
          clearTimeout(_callTimeout);
        }
        if (_monitorInterval) {
          clearInterval(_monitorInterval);
        }
        
        if (peer) {
          try {
            peer.destroy();
          } catch (e) {
            console.log("Error destroying peer:", e);
          }
        }
        
        if (localStream) {
          localStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (e) {
              console.log("Error stopping track:", e);
            }
          });
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
          permissionDenied: false,
          permissionType: null,
          pendingCandidates: [],
          _monitorInterval: null,
          _callTimeout: null,
        });
      },
    }),
    {
      name: "call-storage",
      partialize: (state) => ({
        lastCallInfo: state.lastCallInfo,
        callHistory: state.callHistory,
      }),
    }
  )
);
