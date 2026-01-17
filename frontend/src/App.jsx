import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import NotificationPermission from "./components/NotificationPermission";
import VideoCall from "./components/VideoCall";
import IncomingCall from "./components/IncomingCall";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-base-100 to-base-200">
        <div className="text-center">
          <Loader className="size-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-base-content/70 animate-pulse">Loading...</p>
        </div>
      </div>
    );

  return (
    <div data-theme={theme} className="min-h-screen bg-base-100 transition-colors duration-300">
      <Navbar />
      <NotificationPermission />

      {/* Call Components - Only rendered when authenticated */}
      {authUser && (
        <>
          <VideoCall />
          <IncomingCall />
        </>
      )}

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
    </div>
  );
};
export default App;
