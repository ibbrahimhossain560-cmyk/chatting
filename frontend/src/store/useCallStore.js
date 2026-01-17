import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

// Simple media stream getter
const getMediaStream = async (wantVideo = false) => {
  console.log("getMediaStream called, wantVideo:", wantVideo);
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { stream: null, error: "Browser doesn't support media devices" };
  }

  try {
    const constraints = { audio: true, video: wantVideo };
    console.log("Requesting media with:", constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Got stream with tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
    return { stream, error: null };
  } catch (err) {
    console.error("getUserMedia error:", err.name, err.message);
    
    // If video failed, try audio only
    if (wantVideo) {
      console.log("Video failed, trying audio only...");
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        return { stream: audioStream, error: null, audioOnly: true };
      } catch (audioErr) {
        console.error("Audio only also failed:", audioErr.name);
      }
    }
    
    let errorMessage = "Could not access media devices";
    
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      errorMessage = "Please allow camera/microphone access. Click the camera icon in your browser's address bar.";
    } else if (err.name === "NotFoundError") {
      errorMessage = "No camera/microphone found on this device.";
    } else if (err.name === "NotReadableError") {
      errorMessage = "Camera/microphone is being used by another app.";
    } else if (err.name === "OverconstrainedError") {
      errorMessage = "Device doesn't support the requested settings.";
    }
    
    return { stream: null, error: errorMessage };
  }
};

// Format duration for display
export const formatCallDuration = (seconds) => {
  if (!seconds || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
  }
  return `${secs} sec${secs !== 1 ? 's' : ''}`;
};

export const useCallStore = create(
  persist(
    (set, get) => ({
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
      
      // Call history for chat display
      lastCallInfo: null, // { duration, type, endedAt, withUser }

      setLowDataMode: (enabled) => set({ lowDataMode: enabled }),

      // Handle incoming call from socket
      handleIncomingCall: (data) => {
        console.log("Incoming call received:", data);
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
        });
        
        // Auto-reject after 60 seconds
        setTimeout(() => {
          if (get().callStatus === "receiving") {
            get().rejectCall();
            toast("Missed call from " + data.callerName, { icon: "📞" });
          }
        }, 60000);
      },

      initiateCall: async (receiverUser, type) => {
        const socket = useAuthStore.getState().socket;
        const authUser = useAuthStore.getState().authUser;
        
        if (!socket || !authUser) {
          toast.error("Not connected. Please refresh and try again.");
          return;
        }

        const isVideoCall = type === 'video';
        let actualCallType = type;
        
        const loadingToast = toast.loading("Setting up call...");
        
        try {
          const result = await getMediaStream(isVideoCall);
          
          toast.dismiss(loadingToast);
          
          if (!result.stream) {
            toast.error(result.error || "Could not access microphone");
            return;
          }
          
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
            console.log("Sending signal to receiver");
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
            console.log("Peer connected!");
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
              toast.error("Call connection failed: " + err.message);
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
          toast.error("Failed to start call: " + error.message);
        }
      },

      acceptCall: async () => {
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
            console.log("Sending answer signal");
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
            console.log("Answer: Peer connected!");
            get().startConnectionMonitor();
          });

          peer.on("close", () => get().endCall());
          
          peer.on("error", (err) => {
            console.error("Answer peer error:", err);
            if (get().callStatus === "ongoing") {
              get().attemptReconnect();
            } else {
              toast.error("Connection failed: " + err.message);
              get().endCall();
            }
          });

          peer.signal(incomingSignal);
          set({ peer });
          
        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("Accept call error:", error);
          toast.error("Failed to answer call: " + error.message);
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
        const { peer, localStream, receiver, caller, _monitorInterval, callStartTime, callType } = get();
        
        stopRingtone();
        
        // Calculate and save call duration
        let callDuration = 0;
        if (callStartTime) {
          callDuration = Math.floor((Date.now() - callStartTime) / 1000);
        }
        
        const otherUser = receiver || caller;
        
        // Save last call info for chat display
        if (callDuration > 0 && otherUser) {
          set({
            lastCallInfo: {
              duration: callDuration,
              type: callType,
              endedAt: new Date().toISOString(),
              withUserId: otherUser._id,
            }
          });
        }
        
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

      handleCallAccepted: (signal) => {
        console.log("Call accepted, signaling peer");
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
        const { localStream, usingFrontCamera, peer, isVideoOff } = get();
        if (!localStream) {
          toast.error("No video stream available");
          return;
        }

        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (!currentVideoTrack) {
          toast.error("No video track to switch");
          return;
        }

        try {
          // Stop the current video track
          currentVideoTrack.stop();
          
          // Get new stream with opposite camera
          const newFacingMode = usingFrontCamera ? 'environment' : 'user';
          
          let newStream;
          try {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: { 
                facingMode: { exact: newFacingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false, // Don't get new audio, keep existing
            });
          } catch (exactError) {
            // If exact facingMode fails, try without exact
            console.log("Exact facingMode failed, trying ideal:", exactError);
            newStream = await navigator.mediaDevices.getUserMedia({
              video: { 
                facingMode: { ideal: newFacingMode },
              },
              audio: false,
            });
          }

          const newVideoTrack = newStream.getVideoTracks()[0];
          
          if (!newVideoTrack) {
            toast.error("Could not get new camera");
            return;
          }

          // Replace track in peer connection
          if (peer && peer._pc) {
            const senders = peer._pc.getSenders();
            const videoSender = senders.find(sender => 
              sender.track && sender.track.kind === 'video'
            );
            
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack);
            }
          }

          // Update the local stream
          localStream.removeTrack(currentVideoTrack);
          localStream.addTrack(newVideoTrack);
          
          // Apply video off state if needed
          if (isVideoOff) {
            newVideoTrack.enabled = false;
          }

          set({ 
            usingFrontCamera: !usingFrontCamera,
            localStream: localStream,
          });
          
          toast.success(`Switched to ${!usingFrontCamera ? 'front' : 'back'} camera`);
        } catch (error) {
          console.error("Failed to switch camera:", error);
          
          // Try to restore the camera if switch failed
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: usingFrontCamera ? 'user' : 'environment' },
              audio: false,
            });
            const fallbackTrack = fallbackStream.getVideoTracks()[0];
            if (fallbackTrack) {
              localStream.addTrack(fallbackTrack);
            }
          } catch (restoreError) {
            console.error("Failed to restore camera:", restoreError);
          }
          
          toast.error("Could not switch camera. Device may only have one camera.");
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
      
      // Clear last call info after it's been displayed
      clearLastCallInfo: () => set({ lastCallInfo: null }),
      
      // Cleanup call (called when call fails)
      cleanupCall: () => {
        const { peer, localStream, _monitorInterval } = get();
        
        stopRingtone();
        
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
          _monitorInterval: null,
        });
      },
    }),
    {
      name: "call-storage",
      partialize: (state) => ({
        lastCallInfo: state.lastCallInfo,
      }),
    }
  )
);
