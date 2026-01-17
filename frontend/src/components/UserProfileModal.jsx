import { X, Calendar, Mail, User, Shield, Crown, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";
import { useChatStore } from "../store/useChatStore";

const UserProfileModal = ({ user, onClose, isOpen, onSetNickname }) => {
  const { nicknames } = useChatStore();
  
  if (!user) return null;

  const userNickname = nicknames[user._id]?.myNicknameForThem;

  const formatDate = (date) => {
    if (!date) return "Unknown";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  const getJoinedTimeAgo = (date) => {
    if (!date) return "";
    try {
      const now = new Date();
      const joinDate = new Date(date);
      const diffTime = Math.abs(now - joinDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
          >
            <div 
              className="bg-base-100 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-hidden border border-base-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient background */}
              <div className="relative bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 p-4 sm:p-6 pb-14 sm:pb-20">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 btn btn-circle btn-sm btn-ghost bg-base-100/30 hover:bg-base-100/50 text-base-content"
                >
                  <X className="size-4 sm:size-5" />
                </button>

                {/* Profile picture - positioned to overlap */}
                <div className="absolute -bottom-10 sm:-bottom-16 left-1/2 -translate-x-1/2">
                  <div className="avatar">
                    <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full ring-4 ring-base-100 shadow-xl bg-base-200">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* User info - scrollable */}
              <div className="pt-14 sm:pt-20 px-3 sm:px-6 pb-4 sm:pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Name and badges */}
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2 text-base-content flex-wrap">
                    <span className="truncate max-w-[200px] sm:max-w-[280px]">{user.fullName}</span>
                    {user.isPremium && <span className="text-base sm:text-xl">✨</span>}
                  </h2>
                  {user.badgeType && user.badgeType !== "none" && (
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <Badge badgeType={user.badgeType} size="sm" />
                    </div>
                  )}
                  {user.username && (
                    <p className="text-base-content/60 text-xs sm:text-sm">@{user.username}</p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Email */}
                  {user.email && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200/50 rounded-lg">
                      <Mail className="size-4 sm:size-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-base-content/60">Email</p>
                        <p className="text-xs sm:text-sm font-medium text-base-content truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Username */}
                  {user.username && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200/50 rounded-lg">
                      <User className="size-4 sm:size-5 text-secondary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-base-content/60">Username</p>
                        <p className="text-xs sm:text-sm font-medium text-base-content">@{user.username}</p>
                      </div>
                    </div>
                  )}

                  {/* Join date */}
                  {user.createdAt && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200/50 rounded-lg">
                      <Calendar className="size-4 sm:size-5 text-accent flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-base-content/60">Joined</p>
                        <p className="text-xs sm:text-sm font-medium text-base-content">{formatDate(user.createdAt)}</p>
                        {getJoinedTimeAgo(user.createdAt) && (
                          <p className="text-[10px] sm:text-xs text-base-content/50">
                            {getJoinedTimeAgo(user.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Premium status */}
                  {user.isPremium && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
                      <Crown className="size-4 sm:size-5 text-amber-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-base-content/60">Status</p>
                        <p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
                          Premium Member ✨
                        </p>
                        {user.premiumExpiresAt && (
                          <p className="text-[10px] sm:text-xs text-base-content/50">
                            Expires: {formatDate(user.premiumExpiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Badge info */}
                  {user.badgeType && user.badgeType !== "none" && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200/50 rounded-lg">
                      <Shield className="size-4 sm:size-5 text-info flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-base-content/60">Badge</p>
                        <p className="text-xs sm:text-sm font-medium text-base-content capitalize">{user.badgeType}</p>
                      </div>
                    </div>
                  )}

                  {/* Nickname section */}
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200/50 rounded-lg">
                    <Edit2 className="size-4 sm:size-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-base-content/60">Nickname</p>
                      <p className="text-xs sm:text-sm font-medium text-base-content">
                        {userNickname || "No nickname set"}
                      </p>
                    </div>
                    <button
                      onClick={onSetNickname}
                      className="btn btn-xs btn-ghost text-primary"
                    >
                      {userNickname ? "Change" : "Set"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;
