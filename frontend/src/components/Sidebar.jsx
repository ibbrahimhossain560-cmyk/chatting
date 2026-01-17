import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Bell, BellOff, Search, X, Archive, Trash2, Pin, PinOff, VolumeX, Volume2, MoreVertical, ArchiveRestore } from "lucide-react";
import { notificationManager } from "../lib/notifications";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    archivedUsers = [],
    archiveChat,
    unarchiveChat,
    deleteChat,
    pinChat,
    unpinChat,
    muteChat,
    unmuteChat,
    pinnedUsers = [],
    mutedUsers = [],
  } = useChatStore();

  const { onlineUsers = [] } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    notificationManager.isPermissionGranted()
  );
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const contextMenuRef = useRef(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, user: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationManager.requestPermission();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleContextMenu = (e, user) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX || e.touches?.[0]?.clientX || 0,
      y: e.clientY || e.touches?.[0]?.clientY || 0,
      user,
    });
  };

  const handleLongPress = (user) => {
    // Vibrate for feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setContextMenu({
      visible: true,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      user,
    });
  };

  const handleArchive = async (userId) => {
    try {
      await archiveChat(userId);
      toast.success("Chat archived");
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error("Failed to archive chat");
    }
    setContextMenu({ visible: false, x: 0, y: 0, user: null });
  };

  const handleUnarchive = async (userId) => {
    try {
      await unarchiveChat(userId);
      toast.success("Chat unarchived");
    } catch (error) {
      toast.error("Failed to unarchive chat");
    }
    setContextMenu({ visible: false, x: 0, y: 0, user: null });
  };

  const handleDelete = async (userId) => {
    try {
      await deleteChat(userId);
      toast.success("Chat deleted");
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
      }
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Failed to delete chat");
    }
    setContextMenu({ visible: false, x: 0, y: 0, user: null });
  };

  const handlePin = async (userId) => {
    try {
      if (pinnedUsers.includes(userId)) {
        await unpinChat(userId);
        toast.success("Chat unpinned");
      } else {
        await pinChat(userId);
        toast.success("Chat pinned");
      }
    } catch (error) {
      toast.error("Failed to update pin status");
    }
    setContextMenu({ visible: false, x: 0, y: 0, user: null });
  };

  const handleMute = async (userId) => {
    try {
      if (mutedUsers.includes(userId)) {
        await unmuteChat(userId);
        toast.success("Notifications enabled");
      } else {
        await muteChat(userId);
        toast.success("Chat muted");
      }
    } catch (error) {
      toast.error("Failed to update mute status");
    }
    setContextMenu({ visible: false, x: 0, y: 0, user: null });
  };

  // Filter users based on archived state
  const filteredUsers = (users || []).filter((user) => {
    const isArchived = archivedUsers?.includes(user._id) || false;
    if (showArchived !== isArchived) return false;
    
    const matchesOnline = showOnlineOnly ? onlineUsers?.includes(user._id) : true;
    const matchesSearch = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOnline && matchesSearch;
  });

  // Sort users: pinned first, then by name
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aPinned = pinnedUsers?.includes(a._id) || false;
    const bPinned = pinnedUsers?.includes(b._id) || false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return (a.fullName || "").localeCompare(b.fullName || "");
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

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              showArchived 
                ? 'bg-warning/20 text-warning' 
                : 'bg-base-200/50 text-base-content/70 hover:bg-base-300'
            }`}
          >
            <Archive className="size-3" />
            <span className="hidden sm:inline">
              {showArchived ? 'Archived' : 'Archive'}
            </span>
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="overflow-y-auto flex-1 py-2">
        <AnimatePresence>
          {sortedUsers.map((user, index) => (
            <SwipeableUserItem
              key={user._id}
              user={user}
              index={index}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              onlineUsers={onlineUsers}
              pinnedUsers={pinnedUsers}
              mutedUsers={mutedUsers}
              archivedUsers={archivedUsers}
              showArchived={showArchived}
              onContextMenu={handleContextMenu}
              onLongPress={handleLongPress}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          ))}
        </AnimatePresence>

        {sortedUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 px-4"
          >
            {showArchived ? (
              <>
                <Archive className="size-12 mx-auto text-base-content/20 mb-3" />
                <p className="text-base-content/60 font-medium">No archived chats</p>
                <p className="text-sm text-base-content/40 mt-1">
                  Swipe left on a chat to archive it
                </p>
              </>
            ) : (
              <>
                <Users className="size-12 mx-auto text-base-content/20 mb-3" />
                <p className="text-base-content/60 font-medium">No users found</p>
                <p className="text-sm text-base-content/40 mt-1">
                  {searchQuery ? "Try a different search" : showOnlineOnly ? "No one is online" : ""}
                </p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && contextMenu.user && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[100] bg-base-100 rounded-xl shadow-2xl border border-base-300 overflow-hidden min-w-[200px]"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 280),
              left: Math.min(contextMenu.x, window.innerWidth - 220),
            }}
          >
            <div className="p-3 border-b border-base-300">
              <div className="flex items-center gap-3">
                <img
                  src={contextMenu.user.profilePic || "/avatar.png"}
                  alt={contextMenu.user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold truncate">{contextMenu.user.fullName}</p>
                  <p className="text-xs text-base-content/60">Options</p>
                </div>
              </div>
            </div>
            <div className="py-1">
              {/* Pin/Unpin */}
              <button
                onClick={() => handlePin(contextMenu.user._id)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors"
              >
                {pinnedUsers?.includes(contextMenu.user._id) ? (
                  <>
                    <PinOff className="size-4 text-base-content/70" />
                    <span>Unpin chat</span>
                  </>
                ) : (
                  <>
                    <Pin className="size-4 text-base-content/70" />
                    <span>Pin chat</span>
                  </>
                )}
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={() => handleMute(contextMenu.user._id)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors"
              >
                {mutedUsers?.includes(contextMenu.user._id) ? (
                  <>
                    <Volume2 className="size-4 text-base-content/70" />
                    <span>Unmute notifications</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="size-4 text-base-content/70" />
                    <span>Mute notifications</span>
                  </>
                )}
              </button>

              {/* Archive/Unarchive */}
              {showArchived ? (
                <button
                  onClick={() => handleUnarchive(contextMenu.user._id)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors"
                >
                  <ArchiveRestore className="size-4 text-base-content/70" />
                  <span>Unarchive chat</span>
                </button>
              ) : (
                <button
                  onClick={() => handleArchive(contextMenu.user._id)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors"
                >
                  <Archive className="size-4 text-warning" />
                  <span>Archive chat</span>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => setDeleteConfirm(contextMenu.user)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-error/10 transition-colors text-error"
              >
                <Trash2 className="size-4" />
                <span>Delete chat</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Delete Chat?</h3>
              <p className="text-base-content/70 mb-6">
                This will delete your chat history with <span className="font-semibold">{deleteConfirm.fullName}</span>. 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm._id)}
                  className="btn btn-error flex-1"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

// Simple User Item Component (no swipe - simpler and more reliable)
const SwipeableUserItem = ({
  user,
  index,
  selectedUser,
  setSelectedUser,
  onlineUsers = [],
  pinnedUsers = [],
  mutedUsers = [],
  archivedUsers = [],
  showArchived,
  onContextMenu,
  onLongPress,
  onArchive,
  onUnarchive,
}) => {
  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const isPinned = pinnedUsers?.includes(user._id) || false;
  const isMuted = mutedUsers?.includes(user._id) || false;

  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.touches?.[0]?.clientX || e.clientX || 0,
      y: e.touches?.[0]?.clientY || e.clientY || 0,
    };
    setIsLongPressing(false);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress(user);
    }, 500);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches?.[0]?.clientX || e.clientX || 0;
    const currentY = e.touches?.[0]?.clientY || e.clientY || 0;
    const diffX = Math.abs(currentX - touchStartPos.current.x);
    const diffY = Math.abs(currentY - touchStartPos.current.y);
    
    // Cancel long press if user moves finger
    if (diffX > 10 || diffY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    // Don't open chat if we just did a long press
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }
    setSelectedUser(user);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      className="relative"
    >
      <button
        onContextMenu={(e) => onContextMenu(e, user)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onClick={handleClick}
        className={`
          w-full p-3 lg:p-4 flex items-center gap-3 bg-base-100
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
            {isPinned && <Pin className="size-3 text-primary" />}
            <h3 className="font-semibold truncate">{user.fullName}</h3>
            <Badge badgeType={user.badgeType} size="xs" />
            {user.isPremium && (
              <span className="text-xs">✨</span>
            )}
            {isMuted && <VolumeX className="size-3 text-base-content/40" />}
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

        {/* More options button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, user);
          }}
          className="p-2 rounded-full hover:bg-base-300 transition-colors"
        >
          <MoreVertical className="size-4 text-base-content/60" />
        </button>
      </button>
    </motion.div>
  );
};

export default Sidebar;
