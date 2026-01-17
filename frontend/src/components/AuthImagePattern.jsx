import { motion } from "framer-motion";
import { MessageSquare, Heart, Send, Smile, Image, Video, Phone } from "lucide-react";

const AuthImagePattern = ({ title, subtitle }) => {
  const icons = [MessageSquare, Heart, Send, Smile, Image, Video, Phone, MessageSquare, Send];
  const colors = [
    "text-primary",
    "text-error",
    "text-secondary",
    "text-warning",
    "text-info",
    "text-accent",
    "text-success",
    "text-primary",
    "text-secondary",
  ];

  return (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary/5 via-base-200 to-secondary/5 p-12 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut",
          }}
          style={{ top: "10%", left: "20%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: "easeInOut",
          }}
          style={{ bottom: "10%", right: "10%" }}
        />
      </div>

      <div className="max-w-md text-center relative z-10">
        {/* Animated grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {icons.map((Icon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: i * 0.1,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`aspect-square rounded-2xl bg-base-100 shadow-lg flex items-center justify-center ${
                i % 2 === 0 ? "animate-float" : ""
              }`}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <Icon className={`w-8 h-8 ${colors[i]}`} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-4 gradient-text">{title}</h2>
          <p className="text-base-content/60 leading-relaxed">{subtitle}</p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center justify-center gap-4 text-sm text-base-content/50"
        >
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Real-time chat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Video calls
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Secure
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthImagePattern;
