import { MessageSquare, Users, Phone, Video, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-base-100 via-base-100 to-base-200/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center space-y-8"
      >
        {/* Animated Icons */}
        <div className="flex justify-center items-center gap-4">
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0 }}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
          >
            <MessageSquare className="w-6 h-6 text-primary" />
          </motion.div>
          
          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/25"
          >
            <Sparkles className="w-8 h-8 text-primary-content" />
          </motion.div>
          
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.4 }}
            className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"
          >
            <Users className="w-6 h-6 text-secondary" />
          </motion.div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="text-2xl lg:text-3xl font-bold">
            Welcome to <span className="gradient-text">Chatty!</span>
          </h2>
          <p className="text-base-content/60 text-sm lg:text-base leading-relaxed">
            Select a conversation from the sidebar to start chatting with your friends
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-base-content/70">Messages</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs font-medium text-base-content/70">Audio Call</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs font-medium text-base-content/70">Video Call</span>
          </motion.div>
        </div>

        {/* Hint */}
        <p className="text-xs text-base-content/40 pt-4">
          💡 Click on a contact to start a conversation
        </p>
      </motion.div>
    </div>
  );
};

export default NoChatSelected;
