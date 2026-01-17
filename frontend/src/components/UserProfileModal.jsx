import { X, Calendar, Mail, User, Shield, Crown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";
import { formatDistanceToNow } from "date-fns";

const UserProfileModal = ({ user, onClose, isOpen }) => {
  if (!user) return null;

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
    if (!date) return "Unknown";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Unknown";
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-base-300">
              {/* Header with gradient background */}
              <div className="relative bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 pb-20">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 btn btn-circle btn-sm btn-ghost hover:bg-base-100/50"
                >
                  <X className="size-5" />
                </button>

                {/* Profile picture - positioned to overlap */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                  <div className="avatar">
                    <div className="w-32 h-32 rounded-full ring-4 ring-base-100 shadow-xl">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* User info */}
              <div className="pt-20 px-6 pb-6">
                {/* Name and badges */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    {user.fullName}
                    {user.isPremium && <span className="text-xl">✨</span>}
                  </h2>
                  {user.badgeType && user.badgeType !== "none" && (
                    <div className="flex justify-center mb-3">
                      <Badge badgeType={user.badgeType} size="md" />
                    </div>
                  )}
                  {user.username && (
                    <p className="text-base-content/60 text-sm">@{user.username}</p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {/* Email */}
                  {user.email && (
                    <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                      <Mail className="size-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-base-content/60">Email</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Username */}
                  {user.username && (
                    <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                      <User className="size-5 text-secondary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-base-content/60">Username</p>
                        <p className="text-sm font-medium">@{user.username}</p>
                      </div>
                    </div>
                  )}

                  {/* Join date */}
                  {user.createdAt && (
                    <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                      <Calendar className="size-5 text-accent flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-base-content/60">Joined</p>
                        <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                        <p className="text-xs text-base-content/50">
                          {getJoinedTimeAgo(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Premium status */}
                  {user.isPremium && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
                      <Crown className="size-5 text-amber-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-base-content/60">Status</p>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          Premium Member ✨
                        </p>
                        {user.premiumExpiresAt && (
                          <p className="text-xs text-base-content/50">
                            Expires: {formatDate(user.premiumExpiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Badge info */}
                  {user.badgeType && user.badgeType !== "none" && (
                    <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                      <Shield className="size-5 text-info flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-base-content/60">Badge</p>
                        <p className="text-sm font-medium capitalize">{user.badgeType}</p>
                      </div>
                    </div>
                  )}
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
