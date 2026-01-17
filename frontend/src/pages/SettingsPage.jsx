import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Bell, BellOff, Palette, Sparkles } from "lucide-react";
import { notificationManager } from "../lib/notifications";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const [notificationPermission, setNotificationPermission] = useState(
    notificationManager.permission
  );

  useEffect(() => {
    // Update permission state when it changes
    const checkPermission = () => {
      setNotificationPermission(notificationManager.permission);
    };
    
    // Check periodically in case user changes permission in browser settings
    const interval = setInterval(checkPermission, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationToggle = async () => {
    if (notificationPermission !== 'granted') {
      const granted = await notificationManager.requestPermission();
      setNotificationPermission(notificationManager.permission);
      
      if (granted) {
        // Show test notification
        notificationManager.showNotification('Notifications Enabled!', {
          body: 'You will now receive message notifications when away from the app.',
          icon: '/avatar.png'
        });
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 pt-16 sm:pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Page Header */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Settings</h1>
            <p className="text-base-content/60 mt-1">Customize your chat experience</p>
          </div>
          
          {/* Notifications Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-base-100 rounded-2xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <p className="text-sm text-base-content/70 mb-4">
              Manage your notification preferences
            </p>

            <div className="bg-base-200/50 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  {notificationPermission === 'granted' ? (
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-success" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center flex-shrink-0">
                      <BellOff className="w-5 h-5 text-base-content/60" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">Browser Notifications</h3>
                    <p className="text-sm text-base-content/70">
                      {notificationPermission === 'granted'
                        ? 'Notifications are enabled'
                        : notificationPermission === 'denied'
                        ? 'Notifications are blocked. Enable in browser settings.'
                        : 'Get notified when you receive new messages'}
                    </p>
                  </div>
                </div>
                
                {notificationPermission !== 'denied' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNotificationToggle}
                    className={`btn ${
                      notificationPermission === 'granted' ? 'btn-success' : 'btn-primary'
                    } flex-shrink-0`}
                    disabled={notificationPermission === 'granted'}
                  >
                    {notificationPermission === 'granted' ? '✓ Enabled' : 'Enable'}
                  </motion.button>
                )}
              </div>
              
              {notificationPermission === 'denied' && (
                <div className="mt-4 p-4 bg-warning/10 rounded-xl border border-warning/20">
                  <p className="text-sm text-warning">
                    ⚠️ Notifications are blocked. To enable them:
                    <br />
                    1. Click the lock icon in your browser's address bar
                    <br />
                    2. Set notifications to "Allow"
                    <br />
                    3. Refresh the page
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Theme Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-base-100 rounded-2xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Theme</h2>
            </div>
            <p className="text-sm text-base-content/70 mb-4">Choose a theme for your chat interface</p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
              {THEMES.map((t) => (
                <motion.button
                  key={t}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-all
                    ${theme === t 
                      ? "bg-primary/20 ring-2 ring-primary shadow-lg" 
                      : "bg-base-200/50 hover:bg-base-200"}
                  `}
                  onClick={() => setTheme(t)}
                >
                  <div className="relative h-8 sm:h-10 w-full rounded-lg overflow-hidden shadow-sm" data-theme={t}>
                    <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1">
                      <div className="rounded-sm bg-primary"></div>
                      <div className="rounded-sm bg-secondary"></div>
                      <div className="rounded-sm bg-accent"></div>
                      <div className="rounded-sm bg-neutral"></div>
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium truncate w-full text-center ${
                    theme === t ? "text-primary" : ""
                  }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Preview Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-base-100 rounded-2xl shadow-lg p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Preview</h2>
            </div>
            
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-200 shadow-inner">
              <div className="p-3 sm:p-4">
                <div className="max-w-lg mx-auto">
                  {/* Mock Chat UI */}
                  <div className="bg-base-100 rounded-xl shadow-lg overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-bold shadow-md">
                          J
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">John Doe</h3>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <p className="text-xs text-base-content/70">Online</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-4 space-y-4 min-h-[180px] max-h-[200px] overflow-y-auto bg-base-100">
                      {PREVIEW_MESSAGES.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-2xl p-3 shadow-sm
                              ${message.isSent 
                                ? "bg-primary text-primary-content rounded-br-sm" 
                                : "bg-base-200 rounded-bl-sm"}
                            `}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`
                                text-[10px] mt-1.5
                                ${message.isSent ? "text-primary-content/70" : "text-base-content/60"}
                              `}
                            >
                              12:00 PM
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 sm:p-4 border-t border-base-300 bg-base-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 text-sm bg-base-200/50 focus:bg-base-100"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn btn-primary btn-circle shadow-lg shadow-primary/25"
                        >
                          <Send size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
export default SettingsPage;
