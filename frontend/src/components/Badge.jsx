import { motion } from "framer-motion";

// Generate unique IDs for SVG gradients to prevent conflicts
const generateGradientId = (base) => `${base}_${Math.random().toString(36).substr(2, 9)}`;

// Beautiful SVG badges - Admin/Mod only badges
export const ADMIN_BADGES = {
  admin: {
    name: "Admin",
    color: "from-red-500 to-orange-500",
    getIcon: () => {
      const gradId = generateGradientId("adminGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="3" y1="2" x2="21" y2="22.5">
              <stop offset="0%" stopColor="#EF4444"/>
              <stop offset="100%" stopColor="#F97316"/>
            </linearGradient>
          </defs>
          <path d="M12 2L3 7V12C3 16.97 7.02 21.5 12 22.5C16.98 21.5 21 16.97 21 12V7L12 2Z" fill={`url(#${gradId})`} />
          <path d="M12 6L9 9L12 12L15 9L12 6Z" fill="white" fillOpacity="0.9"/>
          <path d="M9 11L6 14L9 17L12 14L9 11Z" fill="white" fillOpacity="0.7"/>
          <path d="M15 11L12 14L15 17L18 14L15 11Z" fill="white" fillOpacity="0.7"/>
        </svg>
      );
    },
  },
  moderator: {
    name: "Moderator",
    color: "from-purple-500 to-pink-500",
    getIcon: () => {
      const gradId = generateGradientId("modGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="3" y1="2" x2="21" y2="22.5">
              <stop offset="0%" stopColor="#A855F7"/>
              <stop offset="100%" stopColor="#EC4899"/>
            </linearGradient>
          </defs>
          <path d="M12 2L3 7V12C3 16.97 7.02 21.5 12 22.5C16.98 21.5 21 16.97 21 12V7L12 2Z" fill={`url(#${gradId})`} />
          <path d="M12 7L14.5 12L12 17L9.5 12L12 7Z" fill="white" fillOpacity="0.9"/>
        </svg>
      );
    },
  },
  founder: {
    name: "Founder",
    color: "from-yellow-400 to-amber-600",
    getIcon: () => {
      const gradId = generateGradientId("founderGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="21">
              <stop offset="0%" stopColor="#FACC15"/>
              <stop offset="100%" stopColor="#D97706"/>
            </linearGradient>
          </defs>
          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill={`url(#${gradId})`} />
          <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.9"/>
        </svg>
      );
    },
  },
  developer: {
    name: "Developer",
    color: "from-cyan-500 to-blue-600",
    getIcon: () => {
      const gradId = generateGradientId("devGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="3" y1="4" x2="21" y2="20">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#2563EB"/>
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="18" height="16" rx="2" fill={`url(#${gradId})`} />
          <path d="M7 10L10 12L7 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 14H17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    },
  },
  partner: {
    name: "Partner",
    color: "from-emerald-500 to-teal-600",
    getIcon: () => {
      const gradId = generateGradientId("partnerGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="2" y1="3" x2="22" y2="21.35">
              <stop offset="0%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#0D9488"/>
            </linearGradient>
          </defs>
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill={`url(#${gradId})`} />
        </svg>
      );
    },
  },
};

// Premium user badges (users can choose)
export const PREMIUM_BADGES = {
  verified: {
    name: "Verified",
    color: "from-blue-400 to-blue-600",
    getIcon: () => {
      const gradId = generateGradientId("verifiedGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22">
              <stop offset="0%" stopColor="#60A5FA"/>
              <stop offset="100%" stopColor="#2563EB"/>
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill={`url(#${gradId})`} />
          <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    },
  },
  premium: {
    name: "Premium",
    color: "from-amber-400 to-yellow-500",
    getIcon: () => {
      const gradId = generateGradientId("premiumGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="21.5">
              <stop offset="0%" stopColor="#FBBF24"/>
              <stop offset="100%" stopColor="#EAB308"/>
            </linearGradient>
          </defs>
          <path d="M12 2L15 8.5L22 9.5L17 14.5L18.5 21.5L12 18L5.5 21.5L7 14.5L2 9.5L9 8.5L12 2Z" fill={`url(#${gradId})`} />
        </svg>
      );
    },
  },
  vip: {
    name: "VIP",
    color: "from-violet-500 to-purple-600",
    getIcon: () => {
      const gradId = generateGradientId("vipGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="100%" stopColor="#7C3AED"/>
            </linearGradient>
          </defs>
          <path d="M2 7L12 2L22 7V17L12 22L2 17V7Z" fill={`url(#${gradId})`} />
          <text x="12" y="14" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">VIP</text>
        </svg>
      );
    },
  },
  star: {
    name: "Star",
    color: "from-pink-400 to-rose-500",
    getIcon: () => {
      const gradId = generateGradientId("starGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="3" y1="2" x2="21" y2="21.02">
              <stop offset="0%" stopColor="#F472B6"/>
              <stop offset="100%" stopColor="#F43F5E"/>
            </linearGradient>
          </defs>
          <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" fill={`url(#${gradId})`} />
        </svg>
      );
    },
  },
  diamond: {
    name: "Diamond",
    color: "from-cyan-300 to-sky-500",
    getIcon: () => {
      const gradId = generateGradientId("diamondGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="2" y1="3" x2="22" y2="21">
              <stop offset="0%" stopColor="#67E8F9"/>
              <stop offset="100%" stopColor="#0EA5E9"/>
            </linearGradient>
          </defs>
          <path d="M6 3H18L22 9L12 21L2 9L6 3Z" fill={`url(#${gradId})`} />
          <path d="M2 9H22" stroke="white" strokeWidth="0.5" strokeOpacity="0.5"/>
          <path d="M12 21L8 9L12 3L16 9L12 21Z" fill="white" fillOpacity="0.2"/>
        </svg>
      );
    },
  },
  crown: {
    name: "Crown",
    color: "from-yellow-400 to-orange-500",
    getIcon: () => {
      const gradId = generateGradientId("crownGrad");
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="3" y1="3" x2="21" y2="18">
              <stop offset="0%" stopColor="#FACC15"/>
              <stop offset="100%" stopColor="#F97316"/>
            </linearGradient>
          </defs>
          <path d="M3 18V14L6 8L12 12L18 8L21 14V18H3Z" fill={`url(#${gradId})`} />
          <circle cx="6" cy="8" r="2" fill={`url(#${gradId})`}/>
          <circle cx="12" cy="5" r="2" fill={`url(#${gradId})`}/>
          <circle cx="18" cy="8" r="2" fill={`url(#${gradId})`}/>
        </svg>
      );
    },
  },
};

// All badges combined
export const ALL_BADGES = { ...ADMIN_BADGES, ...PREMIUM_BADGES };

// Badge display component
const Badge = ({ badgeType, size = "sm", showTooltip = true, className = "" }) => {
  if (!badgeType || badgeType === "none") return null;

  const badge = ALL_BADGES[badgeType];
  if (!badge) return null;

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.2 }}
      className={`inline-flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`}
      title={showTooltip ? badge.name : undefined}
      style={{ minWidth: sizeClasses[size].split(" ")[0].replace("w-", "") + "rem" }}
    >
      {badge.getIcon()}
    </motion.div>
  );
};

// Badge with name
export const BadgeWithName = ({ badgeType, size = "sm" }) => {
  if (!badgeType || badgeType === "none") return null;

  const badge = ALL_BADGES[badgeType];
  if (!badge) return null;

  return (
    <div className="inline-flex items-center gap-1">
      <Badge badgeType={badgeType} size={size} showTooltip={false} />
      <span className={`text-xs font-medium bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}>
        {badge.name}
      </span>
    </div>
  );
};

// Badge selector for admin
export const BadgeSelector = ({ selectedBadge, onSelect, isAdmin = false }) => {
  const availableBadges = isAdmin ? ALL_BADGES : PREMIUM_BADGES;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {/* None option */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect("none")}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
          selectedBadge === "none" || !selectedBadge
            ? "border-primary bg-primary/10"
            : "border-base-300 hover:border-base-content/30"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center text-base-content/40">
          ✕
        </div>
        <span className="text-xs font-medium">None</span>
      </motion.button>

      {Object.entries(availableBadges).map(([key, badge]) => (
        <motion.button
          key={key}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(key)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
            selectedBadge === key
              ? "border-primary bg-primary/10"
              : "border-base-300 hover:border-base-content/30"
          }`}
        >
          <div className="w-8 h-8">
            {badge.getIcon()}
          </div>
          <span className={`text-xs font-medium bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}>
            {badge.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default Badge;
