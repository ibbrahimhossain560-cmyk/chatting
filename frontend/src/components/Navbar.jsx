import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-base-100/80 backdrop-blur-xl border-b border-base-300 fixed w-full top-0 z-40 safe-area-inset">
      <div className="container mx-auto px-4 h-14 sm:h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary-content" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold gradient-text">Chatty</h1>
              <p className="text-[10px] text-base-content/50 -mt-1">Connect & Chat</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/settings"
              className="btn btn-ghost btn-sm gap-2 hover:bg-base-200 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            {authUser && (
              <>
                <Link
                  to="/profile"
                  className="btn btn-ghost btn-sm gap-2 hover:bg-base-200 transition-all"
                >
                  <div className="avatar">
                    <div className="w-6 h-6 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-1">
                      <img
                        src={authUser.profilePic || "/avatar.png"}
                        alt={authUser.fullName}
                      />
                    </div>
                  </div>
                  <span>Profile</span>
                </Link>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-error btn-sm gap-2"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden btn btn-ghost btn-circle btn-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-base-300 bg-base-100/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-3 space-y-1">
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-base-200 transition-colors"
              >
                <Settings className="w-5 h-5 text-primary" />
                <span className="font-medium">Settings</span>
              </Link>

              {authUser && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-base-200 transition-colors"
                  >
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img
                          src={authUser.profilePic || "/avatar.png"}
                          alt={authUser.fullName}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{authUser.fullName}</p>
                      <p className="text-xs text-base-content/60">View profile</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error/10 text-error transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
export default Navbar;
