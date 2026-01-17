import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// Audio for ringtone
let ringtoneAudio = null;

const playRingtone = () => {
  try {
    if (ringtoneAudio) return;
    ringtoneAudio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
    ringtoneAudio.loop = true;
    ringtoneAudio.volume = 0.5;
    ringtoneAudio.play().catch(() => {});
  } catch (e) {}
};

const stopRingtone = () => {
  try {
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio = null;
    }
  } catch (e) {}
};

// ICE Servers config
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export const formatCallDuration = (seconds) => {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ":" + String(secs).padStart(2, "0");
};

export const useCallStore = create(
  persist(
    (set, get) => ({
      // State
      callStatus: "idle", // idle, calling, receiving, ongoing
      callType: null,
      caller: null,
      receiver: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callStartTime: null,
      pendingOffer: null,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      isOnHold: false,
      usingFrontCamera: true,
      callHistory: [],
      lastCallInfo: null,
      _callTimeout: null,

      // Get media stream - THIS TRIGGERS PERMISSION PROMPT
      getMediaStream: async (withVideo) => {
        console.log("📹 Requesting media, video:", withVideo);
        
        const constraints = {
          audio: { echoCancellation: true, noiseSuppression: true },
          video: withVideo ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
        };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("✅ Got media stream");
          return { success: true, stream };
        } catch (err) {
          console.error("❌ Media error:", err.name);
          
          // If video failed, try audio only
          if (withVideo) {
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              console.log("✅ Got audio only stream");
              return { success: true, stream: audioStream, audioOnly: true };
            } catch (audioErr) {
              return { success: false, error: "Microphone access denied" };
            }
          }
          return { success: false, error: err.name === "NotAllowedError" ? "Permission denied" : "Cannot access media" };
        }
      },

      // Create RTCPeerConnection
      createPeerConnection: () => {
        console.log("🔗 Creating peer connection");
        const pc = new RTCPeerConnection(iceServers);
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const socket = useAuthStore.getState().socket;
            const { receiver, caller } = get();
            const targetId = receiver?._id || caller?._id;
            if (socket && targetId) {
              console.log("📤 Sending ICE candidate");
              socket.emit("iceCandidate", { to: targetId, candidate: event.candidate });
            }
          }
        };

        pc.ontrack = (event) => {
          console.log("📥 Got remote track");
          if (event.streams && event.streams[0]) {
            set({ remoteStream: event.streams[0] });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log("📶 Connection state:", pc.connectionState);
          if (pc.connectionState === "connected") {
            set({ callStatus: "ongoing", callStartTime: Date.now() });
          } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            toast.error("Connection lost");
            get().endCall();
          }
        };

        set({ peerConnection: pc });
        return pc;
      },

      // INITIATE A CALL
      initiateCall: async (receiverUser, type) => {
        const socket = useAuthStore.getState().socket;
        const authUser = useAuthStore.getState().authUser;
        
        if (!socket?.connected) {
          toast.error("Not connected to server");
          return;
        }

        if (get().callStatus !== "idle") {
          toast.error("Already in a call");
          return;
        }

        const isVideo = type === "video";
        console.log("📞 Starting call, video:", isVideo);

        // GET PERMISSION FIRST - This triggers the browser prompt
        const mediaResult = await get().getMediaStream(isVideo);
        if (!mediaResult.success) {
          toast.error(mediaResult.error);
          return;
        }

        const stream = mediaResult.stream;
        const actualType = mediaResult.audioOnly ? "audio" : type;
        
        set({
          callStatus: "calling",
          callType: actualType,
          receiver: receiverUser,
          localStream: stream,
          isVideoOff: actualType === "audio",
        });

        // Create peer connection and add tracks
        const pc = get().createPeerConnection();
        stream.getTracks().forEach((track) => {
          console.log("➕ Adding track:", track.kind);
          pc.addTrack(track, stream);
        });

        // Create offer
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: isVideo,
          });
          await pc.setLocalDescription(offer);
          console.log("📤 Sending call offer");

          socket.emit("callUser", {
            userToCall: receiverUser._id,
            signalData: offer,
            from: authUser._id,
            callerName: authUser.fullName,
            callerPic: authUser.profilePic,
            callType: actualType,
          });

          // Timeout
          const timeout = setTimeout(() => {
            if (get().callStatus === "calling") {
              toast.error("No answer");
              get().endCall();
            }
          }, 45000);
          set({ _callTimeout: timeout });
          
        } catch (err) {
          console.error("❌ Offer error:", err);
          toast.error("Failed to start call");
          get().cleanupCall();
        }
      },

      // HANDLE INCOMING CALL
      handleIncomingCall: (data) => {
        console.log("📲 Incoming call from:", data.callerName);
        
        if (get().callStatus !== "idle") {
          const socket = useAuthStore.getState().socket;
          socket?.emit("rejectCall", { to: data.from });
          return;
        }

        playRingtone();
        set({
          callStatus: "receiving",
          caller: { _id: data.from, fullName: data.callerName, profilePic: data.callerPic },
          pendingOffer: data.signal,
          callType: data.callType,
        });

        // Auto-reject after 45s
        const timeout = setTimeout(() => {
          if (get().callStatus === "receiving") {
            get().rejectCall();
            toast("Missed call from " + data.callerName, { icon: "📞" });
          }
        }, 45000);
        set({ _callTimeout: timeout });
      },

      // ACCEPT CALL
      acceptCall: async () => {
        const socket = useAuthStore.getState().socket;
        const { pendingOffer, caller, callType, _callTimeout } = get();
        
        if (_callTimeout) clearTimeout(_callTimeout);
        stopRingtone();

        if (!pendingOffer || !caller) {
          toast.error("Call data missing");
          get().cleanupCall();
          return;
        }

        const isVideo = callType === "video";
        console.log("✅ Accepting call, video:", isVideo);

        // GET PERMISSION - This triggers browser prompt
        const mediaResult = await get().getMediaStream(isVideo);
        if (!mediaResult.success) {
          toast.error(mediaResult.error);
          get().rejectCall();
          return;
        }

        const stream = mediaResult.stream;
        const actualType = mediaResult.audioOnly ? "audio" : callType;

        set({
          localStream: stream,
          callType: actualType,
          isVideoOff: actualType === "audio",
        });

        // Create peer connection and add tracks
        const pc = get().createPeerConnection();
        stream.getTracks().forEach((track) => {
          console.log("➕ Adding track:", track.kind);
          pc.addTrack(track, stream);
        });

        try {
          // Set remote description (the offer)
          await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
          
          // Create answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          console.log("📤 Sending answer");
          socket.emit("answerCall", { signal: answer, to: caller._id });
          
        } catch (err) {
          console.error("❌ Answer error:", err);
          toast.error("Failed to answer");
          get().rejectCall();
        }
      },

      // HANDLE CALL ACCEPTED (caller receives answer)
      handleCallAccepted: async (signal) => {
        const { peerConnection, _callTimeout } = get();
        
        if (_callTimeout) clearTimeout(_callTimeout);
        console.log("✅ Call accepted, setting remote description");

        if (!peerConnection) {
          get().cleanupCall();
          return;
        }

        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (err) {
          console.error("❌ Error setting remote description:", err);
          toast.error("Connection failed");
          get().cleanupCall();
        }
      },

      // HANDLE ICE CANDIDATE
      handleIceCandidate: async (candidate) => {
        const { peerConnection } = get();
        if (peerConnection && candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("✅ Added ICE candidate");
          } catch (err) {
            console.error("❌ ICE candidate error:", err);
          }
        }
      },

      // REJECT CALL
      rejectCall: () => {
        const socket = useAuthStore.getState().socket;
        const { caller, _callTimeout } = get();
        
        if (_callTimeout) clearTimeout(_callTimeout);
        stopRingtone();
        
        if (socket?.connected && caller) {
          socket.emit("rejectCall", { to: caller._id });
        }
        get().cleanupCall();
      },

      handleCallRejected: () => {
        const { _callTimeout } = get();
        if (_callTimeout) clearTimeout(_callTimeout);
        stopRingtone();
        toast("Call declined", { icon: "📞" });
        get().cleanupCall();
      },

      handleCallEnded: () => {
        const { _callTimeout } = get();
        if (_callTimeout) clearTimeout(_callTimeout);
        stopRingtone();
        toast("Call ended", { icon: "📞" });
        get().cleanupCall();
      },

      // END CALL
      endCall: () => {
        const socket = useAuthStore.getState().socket;
        const { receiver, caller, callStartTime, callType, _callTimeout } = get();
        
        if (_callTimeout) clearTimeout(_callTimeout);
        stopRingtone();

        // Calculate duration
        let duration = 0;
        if (callStartTime) {
          duration = Math.floor((Date.now() - callStartTime) / 1000);
        }

        const otherUser = receiver || caller;
        if (otherUser && duration > 0) {
          const callInfo = {
            duration,
            type: callType,
            endedAt: new Date().toISOString(),
            withUserId: otherUser._id,
            withUserName: otherUser.fullName,
            withUserPic: otherUser.profilePic,
            wasCaller: !!receiver,
          };
          set({ lastCallInfo: callInfo });
          const history = get().callHistory;
          set({ callHistory: [{ ...callInfo, id: Date.now() }, ...history].slice(0, 50) });
        }

        // Notify other party
        if (socket?.connected && otherUser) {
          socket.emit("endCall", { to: otherUser._id });
        }

        get().cleanupCall();
      },

      // CLEANUP
      cleanupCall: () => {
        const { peerConnection, localStream, _callTimeout } = get();
        
        if (_callTimeout) clearTimeout(_callTimeout);
        stopRingtone();

        if (peerConnection) {
          peerConnection.close();
        }

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }

        set({
          callStatus: "idle",
          callType: null,
          caller: null,
          receiver: null,
          localStream: null,
          remoteStream: null,
          peerConnection: null,
          callStartTime: null,
          pendingOffer: null,
          isMuted: false,
          isVideoOff: false,
          isOnHold: false,
          _callTimeout: null,
        });
      },

      // CONTROLS
      toggleMute: () => {
        const { localStream, isMuted } = get();
        if (localStream) {
          localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
          set({ isMuted: !isMuted });
        }
      },

      toggleVideo: () => {
        const { localStream, isVideoOff, callType } = get();
        if (callType === "audio") {
          toast("Video not available");
          return;
        }
        if (localStream) {
          localStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
          set({ isVideoOff: !isVideoOff });
        }
      },

      toggleSpeaker: () => set((s) => ({ isSpeakerOn: !s.isSpeakerOn })),

      toggleHold: () => {
        const { localStream, isOnHold } = get();
        if (localStream) {
          localStream.getTracks().forEach((t) => (t.enabled = isOnHold));
          set({ isOnHold: !isOnHold });
        }
      },

      switchCamera: async () => {
        const { localStream, usingFrontCamera, peerConnection, isVideoOff } = get();
        const currentVideo = localStream?.getVideoTracks()[0];
        if (!currentVideo) return;

        try {
          currentVideo.stop();
          const newFacing = usingFrontCamera ? "environment" : "user";
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: newFacing },
            audio: false,
          });
          const newTrack = newStream.getVideoTracks()[0];

          if (peerConnection) {
            const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
            if (sender) await sender.replaceTrack(newTrack);
          }

          localStream.removeTrack(currentVideo);
          localStream.addTrack(newTrack);
          if (isVideoOff) newTrack.enabled = false;
          set({ usingFrontCamera: !usingFrontCamera });
          toast.success("Camera switched");
        } catch (err) {
          toast.error("Cannot switch camera");
        }
      },

      clearCallHistory: () => set({ callHistory: [] }),
      clearLastCallInfo: () => set({ lastCallInfo: null }),
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
