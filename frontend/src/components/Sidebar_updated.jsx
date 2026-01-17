import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Bell, BellOff, Search, X } from "lucide-react";
import { notificationManager } from "../lib/notifications";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    notificationManager.isPermissionGranted()
  );

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationManager.requestPermission();
      setNotificationsEnabled(granted);
    } else {
      // Can't programmatically disable, just update state
      setNotificationsEnabled(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesOnline = showOnlineOnly ? onlineUsers.includes(user._id) : true;
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOnline && matchesSearch;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full md:w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-300 bg-base-100">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-4 lg:p-5">
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div className="lg:block">
              <h2 className="font-bold text-lg">Chats</h2>
              <p className="text-xs text-base-content/60">
                {onlineUsers.length - 1} online
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10 pr-10 input-sm lg:input-md bg-base-200/50 focus:bg-base-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="size-4 text-base-content/50 hover:text-base-content" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 bg-base-200/50 px-3 py-1.5 rounded-full">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-xs checkbox-primary"
            />
            <span className="text-xs font-medium">Online only</span>
          </label>
          
          {/* Notification toggle */}
          <button
            onClick={handleToggleNotifications}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              notificationsEnabled 
                ? 'bg-primary/20 text-primary' 
                : 'bg-base-200/50 text-base-content/70 hover:bg-base-300'
            }`}
          >
            {notificationsEnabled ? (
              <Bell className="size-3" />
            ) : (
              <BellOff className="size-3" />
            )}
            <span className="hidden sm:inline">
              {notificationsEnabled ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="overflow-y-auto flex-1 py-2">
        <AnimatePresence>
          {filteredUsers.map((user, index) => (
            <motion.button
              key={user._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 lg:p-4 flex items-center gap-3
                hover:bg-base-200/70 transition-all duration-200
                ${selectedUser?._id === user._id 
                  ? "bg-primary/10 border-l-4 border-primary" 
                  : "border-l-4 border-transparent"
                }
              `}
            >
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-base-100 ${
                  onlineUsers.includes(user._id) ? 'ring-green-500' : 'ring-base-300'
                }`}>
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-base-100 online-indicator" />
                )}
              </div>

              {/* User info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold truncate">{user.fullName}</h3>
                  <Badge badgeType={user.badgeType} size="xs" />
                  {user.isPremium && (
                    <span className="text-xs">✨</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      onlineUsers.includes(user._id) ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <p className="text-sm text-base-content/60 truncate">
                    {onlineUsers.includes(user._id) ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Unread badge placeholder */}
              {/* {user.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-content text-xs flex items-center justify-center font-bold">
                  {user.unreadCount}
                </span>
              )} */}
            </motion.button>
          ))}
        </AnimatePresence>

        {filteredUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 px-4"
          >
            <Users className="size-12 mx-auto text-base-content/20 mb-3" />
            <p className="text-base-content/60 font-medium">No users found</p>
            <p className="text-sm text-base-content/40 mt-1">
              {searchQuery ? "Try a different search" : showOnlineOnly ? "No one is online" : ""}
            </p>
          </motion.div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
