import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, AtSign, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { axiosInstance } from "../lib/axios";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken'

  const { signup, isSigningUp } = useAuthStore();

  const checkUsername = async (username) => {
    if (username.length < 3) {
      setUsernameStatus(null);
      return;
    }
    
    setUsernameStatus('checking');
    try {
      const res = await axiosInstance.get(`/auth/check-username/${username}`);
      setUsernameStatus(res.data.available ? 'available' : 'taken');
    } catch (error) {
      setUsernameStatus(null);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, username: value });
    
    // Debounce the check
    clearTimeout(window.usernameCheckTimeout);
    window.usernameCheckTimeout = setTimeout(() => checkUsername(value), 500);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.username.trim()) return toast.error("Username is required");
    if (formData.username.length < 3) return toast.error("Username must be at least 3 characters");
    if (!/^[a-z0-9_]+$/.test(formData.username)) return toast.error("Username can only contain lowercase letters, numbers, and underscores");
    if (usernameStatus === 'taken') return toast.error("Username is already taken");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const success = validateForm();

    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-base-100 to-base-200">
      {/* left side */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 pt-20 lg:pt-12"
      >
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex flex-col items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
              >
                <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-primary-content" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-3 gradient-text">Create Account</h1>
              <p className="text-base-content/60 text-sm sm:text-base">Get started with your free account</p>
            </div>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-12 bg-base-200/50 focus:bg-base-100 transition-colors"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-12 pr-10 bg-base-200/50 focus:bg-base-100 transition-colors ${
                    usernameStatus === 'available' ? 'input-success' : 
                    usernameStatus === 'taken' ? 'input-error' : ''
                  }`}
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  maxLength={20}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {usernameStatus === 'checking' && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check className="size-5 text-success" />
                  )}
                  {usernameStatus === 'taken' && (
                    <X className="size-5 text-error" />
                  )}
                </div>
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  Letters, numbers, and underscores only
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-12 bg-base-200/50 focus:bg-base-100 transition-colors"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-12 bg-base-200/50 focus:bg-base-100 transition-colors"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary w-full shadow-lg shadow-primary/25 text-base" 
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary font-medium hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* right side */}

      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};
export default SignUpPage;
