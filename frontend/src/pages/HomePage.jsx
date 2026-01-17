import { useChatStore } from "../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div className="flex items-center justify-center pt-16 sm:pt-20 px-0 sm:px-4 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-base-100 sm:rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-[calc(100vh-6rem)] overflow-hidden border-0 sm:border border-base-300"
        >
          <div className="flex h-full relative">
            {/* Sidebar - Always visible on desktop, visible on mobile when no chat selected */}
            <div
              className={`${
                selectedUser ? "hidden md:flex" : "flex"
              } w-full md:w-auto h-full`}
            >
              <Sidebar />
            </div>

            {/* Chat area */}
            <AnimatePresence mode="wait">
              {!selectedUser ? (
                <motion.div
                  key="no-chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hidden md:flex flex-1"
                >
                  <NoChatSelected />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col w-full h-full absolute md:relative inset-0 bg-base-100 z-10"
                >
                  <ChatContainer />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default HomePage;
