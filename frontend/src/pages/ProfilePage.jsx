import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Bell, BellOff, Eye, EyeOff, Calendar, Shield, AtSign, Edit3, Save, X } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { notificationManager } from "../lib/notifications";
import { motion } from "framer-motion";
import Badge, { BadgeSelector, PREMIUM_BADGES } from "../components/Badge";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const {
    notificationsEnabled,
    showSenderName,
    showMessagePreview,
    setNotificationsEnabled,
    setShowSenderName,
    setShowMessagePreview,
  } = useNotificationStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(authUser?.username || "");
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleNotificationToggle = async (enabled) => {
    if (enabled && !notificationManager.isPermissionGranted()) {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        // Show test notification after a delay
        setTimeout(() => {
          notificationManager.showNotification("Notifications Enabled!", {
            body: "You will now receive message notifications when away from the app.",
            icon: "/avatar.png"
          });
        }, 1000);
      }
    } else {
      setNotificationsEnabled(enabled);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername || newUsername === authUser?.username) {
      setIsEditingUsername(false);
      return;
    }
    
    try {
      await updateProfile({ username: newUsername });
      setIsEditingUsername(false);
      toast.success("Username updated!");
    } catch (error) {
      // Error is handled in updateProfile
    }
  };

  const handleBadgeSelect = async (badgeType) => {
    if (!authUser?.isPremium && badgeType !== "none") {
      toast.error("Premium required to use badges");
      return;
    }
    // Note: Badge selection for regular users would need a separate endpoint
    // For now, only admin can assign badges
    setShowBadgeSelector(false);
  };

  // Calculate days until username can be changed
  const getDaysUntilUsernameChange = () => {
    if (!authUser?.lastUsernameChange) return 0;
    const daysSinceChange = (Date.now() - new Date(authUser.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(30 - daysSinceChange));
  };

  const canChangeUsername = getDaysUntilUsernameChange() === 0;
  
  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-8 bg-gradient-to-b from-base-100 to-base-200">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-100 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-content">Profile</h1>
            <p className="mt-1 text-primary-content/80 text-sm sm:text-base">Manage your account settings</p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Avatar upload section */}
            <div className="flex flex-col items-center gap-4 -mt-16 sm:-mt-20">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-base-100 shadow-xl"
                />
                <label
                  htmlFor="avatar-upload"
                  className={`
                    absolute bottom-1 right-1 
                    bg-primary hover:bg-primary/90
                    p-2.5 sm:p-3 rounded-full cursor-pointer 
                    transition-all duration-200 shadow-lg
                    ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                  `}
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary-content" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                </label>
              </motion.div>
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
                  {authUser?.fullName}
                  <Badge badgeType={authUser?.badgeType} size="md" />
                </h2>
                <p className="text-sm text-base-content/60 mt-1">
                  @{authUser?.username || "username"}
                </p>
                {authUser?.isPremium && (
                  <span className="badge badge-warning badge-sm mt-2">✨ Premium</span>
                )}
                <p className="text-xs text-base-content/40 mt-2">
                  {isUpdatingProfile ? "Uploading..." : "Tap to change photo"}
                </p>
              </div>
            </div>

            {/* User info cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-base-200/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-base-content/60 text-sm">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                <p className="font-medium text-lg">{authUser?.fullName}</p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-base-200/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base-content/60 text-sm">
                    <AtSign className="w-4 h-4" />
                    Username
                  </div>
                  {canChangeUsername && !isEditingUsername && (
                    <button 
                      onClick={() => setIsEditingUsername(true)}
                      className="btn btn-ghost btn-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditingUsername ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="input input-sm input-bordered flex-1"
                      placeholder="username"
                      maxLength={20}
                    />
                    <button onClick={handleUsernameUpdate} className="btn btn-sm btn-primary">
                      <Save className="w-3 h-3" />
                    </button>
                    <button onClick={() => setIsEditingUsername(false)} className="btn btn-sm btn-ghost">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-lg">@{authUser?.username || "—"}</p>
                    {!canChangeUsername && (
                      <p className="text-xs text-base-content/40">
                        Can change in {getDaysUntilUsernameChange()} days
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-base-200/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-base-content/60 text-sm">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                <p className="font-medium text-lg break-all">{authUser?.email}</p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-base-200/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-base-content/60 text-sm">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </div>
                <p className="font-medium text-lg">
                  {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric"
                  }) : "N/A"}
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-base-200/50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-base-content/60 text-sm">
                  <Shield className="w-4 h-4" />
                  Account Status
                </div>
                <p className="font-medium text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Active
                </p>
              </motion.div>
            </div>

            {/* Notification Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-base-200/30 rounded-xl p-4 sm:p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Settings
              </h2>
              
              <div className="space-y-4">
                {/* Enable/Disable Notifications */}
                <div className="flex items-center justify-between py-3 border-b border-base-content/10">
                  <div className="flex items-start sm:items-center gap-3">
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5 text-success flex-shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <BellOff className="w-5 h-5 text-base-content/60 flex-shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div>
                      <span className="font-medium">Allow Notifications</span>
                      <p className="text-sm text-base-content/60">
                        Receive notifications when you get new messages
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary flex-shrink-0"
                    checked={notificationsEnabled}
                    onChange={(e) => handleNotificationToggle(e.target.checked)}
                  />
                </div>

                {/* Show Sender Name */}
                <div className="flex items-center justify-between py-3 border-b border-base-content/10">
                  <div className="flex items-start sm:items-center gap-3">
                    <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="font-medium">Show Sender Name</span>
                      <p className="text-sm text-base-content/60">
                        {showSenderName 
                          ? 'Display "New message from [Name]"' 
                          : 'Display "New message" only'
                        }
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary flex-shrink-0"
                    checked={showSenderName}
                    onChange={(e) => setShowSenderName(e.target.checked)}
                    disabled={!notificationsEnabled}
                  />
                </div>

                {/* Show Message Preview */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-start sm:items-center gap-3">
                    {showMessagePreview ? (
                      <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-base-content/60 flex-shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div>
                      <span className="font-medium">Preview Message</span>
                      <p className="text-sm text-base-content/60">
                        {showMessagePreview 
                          ? 'Show message content in notifications' 
                          : 'Hide message content for privacy'
                        }
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary flex-shrink-0"
                    checked={showMessagePreview}
                    onChange={(e) => setShowMessagePreview(e.target.checked)}
                    disabled={!notificationsEnabled}
                  />
                </div>
              </div>

              {/* Notification Preview */}
              {notificationsEnabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 bg-base-200 rounded-xl"
                >
                  <h3 className="text-sm font-medium mb-2">📱 Notification Preview:</h3>
                  <div className="text-sm bg-base-100 p-3 rounded-lg shadow-sm">
                    <div className="font-medium">
                      {showSenderName ? "New message from John Doe" : "New message"}
                    </div>
                    <div className="text-base-content/70 mt-1">
                      {showMessagePreview ? "Hey! How are you doing? 👋" : "You have a new message"}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default ProfilePage;
