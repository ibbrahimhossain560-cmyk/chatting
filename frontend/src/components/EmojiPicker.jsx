import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X, Clock } from "lucide-react";

// Comprehensive emoji categories
const EMOJI_CATEGORIES = {
  recent: { icon: "🕐", name: "Recent" },
  smileys: { icon: "😀", name: "Smileys & Emotion" },
  people: { icon: "👋", name: "People & Body" },
  animals: { icon: "🐱", name: "Animals & Nature" },
  food: { icon: "🍔", name: "Food & Drink" },
  activities: { icon: "⚽", name: "Activities" },
  travel: { icon: "🚗", name: "Travel & Places" },
  objects: { icon: "💡", name: "Objects" },
  symbols: { icon: "❤️", name: "Symbols" },
  flags: { icon: "🏳️", name: "Flags" },
};

const EMOJIS = {
  smileys: [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
    "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚",
    "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
    "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨",
    "🤤", "😪", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵",
    "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐",
    "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦",
    "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
    "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿",
    "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖",
  ],
  people: [
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
    "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
    "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
    "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂",
    "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅",
    "👄", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩",
  ],
  animals: [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
    "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊",
    "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉",
    "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
    "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🕸️", "🦂",
    "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀",
  ],
  food: [
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
    "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
    "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅",
    "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳",
    "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔",
    "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗",
  ],
  activities: [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
    "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
    "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷",
    "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺",
    "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗",
    "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️",
  ],
  travel: [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
    "🛻", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵",
    "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟",
    "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇",
    "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸",
    "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "🪝",
  ],
  objects: [
    "💡", "🔦", "🏮", "🪔", "📱", "📲", "💻", "🖥️", "🖨️", "⌨️",
    "🖱️", "🖲️", "💽", "💾", "💿", "📀", "🧮", "🎥", "🎞️", "📽️",
    "🎬", "📺", "📷", "📸", "📹", "📼", "🔍", "🔎", "🕯️", "💰",
    "🪙", "💴", "💵", "💶", "💷", "💸", "💳", "🧾", "💹", "✉️",
    "📧", "📨", "📩", "📤", "📥", "📦", "📫", "📪", "📬", "📭",
    "📮", "🗳️", "✏️", "✒️", "🖋️", "🖊️", "🖌️", "🖍️", "📝", "💼",
  ],
  symbols: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
    "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
    "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
    "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳",
    "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️",
  ],
  flags: [
    "🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇦🇫", "🇦🇽", "🇦🇱",
    "🇩🇿", "🇦🇸", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇶", "🇦🇬", "🇦🇷", "🇦🇲", "🇦🇼",
    "🇦🇺", "🇦🇹", "🇦🇿", "🇧🇸", "🇧🇭", "🇧🇩", "🇧🇧", "🇧🇾", "🇧🇪", "🇧🇿",
    "🇧🇯", "🇧🇲", "🇧🇹", "🇧🇴", "🇧🇦", "🇧🇼", "🇧🇷", "🇮🇴", "🇻🇬", "🇧🇳",
    "🇧🇬", "🇧🇫", "🇧🇮", "🇰🇭", "🇨🇲", "🇨🇦", "🇮🇨", "🇨🇻", "🇧🇶", "🇰🇾",
    "🇨🇫", "🇹🇩", "🇨🇱", "🇨🇳", "🇨🇽", "🇨🇨", "🇨🇴", "🇰🇲", "🇨🇬", "🇨🇩",
  ],
};

const STORAGE_KEY = "chatty_recent_emojis";

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentEmojis, setRecentEmojis] = useState([]);
  const pickerRef = useRef(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent emojis:", e);
      }
    }
  }, []);

  // Close on click outside with proper event handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the emoji button itself
      if (event.target.closest('[data-emoji-trigger]')) {
        return;
      }
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Use timeout to prevent immediate close on same click
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleEmojiSelect = useCallback((emoji) => {
    // Update recent emojis
    setRecentEmojis((prev) => {
      const newRecent = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 30);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));
      return newRecent;
    });
    
    onSelect(emoji);
    onClose();
  }, [onSelect, onClose]);

  const getFilteredEmojis = () => {
    if (searchQuery) {
      // Search across all categories
      return Object.values(EMOJIS).flat().filter((emoji) => 
        emoji.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory === "recent") {
      return recentEmojis;
    }
    
    return EMOJIS[activeCategory] || [];
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 right-0 w-72 sm:w-80 bg-base-100 rounded-xl shadow-2xl border border-base-300 overflow-hidden z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search bar */}
      <div className="p-2 border-b border-base-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input input-sm pl-9 pr-8 bg-base-200 rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="flex overflow-x-auto p-1 border-b border-base-200 gap-0.5 scrollbar-hide">
          {Object.entries(EMOJI_CATEGORIES).map(([key, { icon, name }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                activeCategory === key
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-base-200"
              }`}
              title={name}
            >
              {key === "recent" ? <Clock className="size-4" /> : <span className="text-lg">{icon}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="h-52 overflow-y-auto p-2">
        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-8 gap-0.5">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiSelect(emoji)}
                className="p-1.5 text-xl hover:bg-base-200 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            {activeCategory === "recent" && !searchQuery
              ? "No recent emojis"
              : "No emojis found"}
          </div>
        )}
      </div>

      {/* Quick access bar */}
      <div className="p-2 border-t border-base-200 bg-base-200/50">
        <div className="flex justify-around">
          {["😀", "❤️", "👍", "😂", "😢", "🎉"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="p-1 text-xl hover:scale-125 active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EmojiPicker;
