import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import Badge, { BadgeSelector, ALL_BADGES, ADMIN_BADGES } from "../components/Badge";
import {
  Shield,
  Users,
  Crown,
  Trash2,
  Key,
  User,
  Search,
  X,
  Lock,
  Unlock,
  Star,
  Ban,
  Check,
  ChevronDown,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  AtSign,
  Mail,
  Calendar,
  Edit3,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dashboard data
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  
  // Modals
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [premiumDays, setPremiumDays] = useState(30);
  const [selectedBadge, setSelectedBadge] = useState("none");
  
  // Password lookup
  const [lookupQuery, setLookupQuery] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await axiosInstance.post("/admin/verify", { password });
      if (res.data.isAdmin) {
        setIsAuthenticated(true);
        toast.success("Welcome, Admin!");
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid password");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get("/admin/stats"),
        axiosInstance.get("/admin/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await axiosInstance.delete(`/admin/users/${selectedUser._id}`);
      toast.success("User deleted successfully");
      setUsers(users.filter(u => u._id !== selectedUser._id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleUpdateBadge = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await axiosInstance.put(`/admin/users/${selectedUser._id}/badge`, {
        badge: selectedBadge,
        badgeType: selectedBadge,
      });
      setUsers(users.map(u => u._id === selectedUser._id ? res.data : u));
      toast.success("Badge updated");
      setShowBadgeModal(false);
    } catch (error) {
      toast.error("Failed to update badge");
    }
  };

  const handleTogglePremium = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await axiosInstance.put(`/admin/users/${selectedUser._id}/premium`, {
        isPremium: !selectedUser.isPremium,
        premiumDays: premiumDays,
      });
      setUsers(users.map(u => u._id === selectedUser._id ? res.data : u));
      toast.success(`Premium ${res.data.isPremium ? 'enabled' : 'disabled'}`);
      setShowPremiumModal(false);
    } catch (error) {
      toast.error("Failed to update premium status");
    }
  };

  const handleResetPassword = async () => {
    const targetUser = foundUser || selectedUser;
    if (!targetUser || !newPassword) return;
    
    try {
      await axiosInstance.put(`/admin/users/${targetUser._id}/password`, {
        newPassword,
      });
      toast.success("Password reset successfully");
      setShowPasswordModal(false);
      setNewPassword("");
      setFoundUser(null);
      setLookupQuery("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    }
  };

  const handleUpdateUsername = async () => {
    if (!selectedUser || !newUsername) return;
    
    try {
      const res = await axiosInstance.put(`/admin/users/${selectedUser._id}/username`, {
        username: newUsername,
      });
      setUsers(users.map(u => u._id === selectedUser._id ? res.data : u));
      toast.success("Username updated");
      setShowUsernameModal(false);
      setNewUsername("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update username");
    }
  };

  const handleToggleBan = async (user) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${user._id}/ban`, {
        isBanned: !user.isBanned,
        banReason: "Banned by admin",
      });
      setUsers(users.map(u => u._id === user._id ? res.data : u));
      toast.success(`User ${res.data.isBanned ? 'banned' : 'unbanned'}`);
    } catch (error) {
      toast.error("Failed to update ban status");
    }
  };

  const handleLookupUser = async () => {
    if (!lookupQuery) return;
    
    try {
      const res = await axiosInstance.post("/admin/find-user", { query: lookupQuery });
      setFoundUser(res.data);
    } catch (error) {
      toast.error("User not found");
      setFoundUser(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 via-base-100 to-base-200 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-100 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-base-content/60 text-sm mt-1">Enter admin password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin Password"
                className="input input-bordered w-full pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-base-content/40" />
                ) : (
                  <Eye className="w-5 h-5 text-base-content/40" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm w-full mt-4"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-base-content/60">Manage users and settings</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="btn btn-ghost btn-sm gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6"
          >
            <div className="bg-base-100 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-base-content/60">Total Users</p>
                </div>
              </div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.premiumUsers}</p>
                  <p className="text-xs text-base-content/60">Premium</p>
                </div>
              </div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.newUsers}</p>
                  <p className="text-xs text-base-content/60">New (7d)</p>
                </div>
              </div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMessages}</p>
                  <p className="text-xs text-base-content/60">Messages</p>
                </div>
              </div>
            </div>
            <div className="bg-base-100 rounded-xl p-4 shadow-lg col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                  <p className="text-xs text-base-content/60">Banned</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`btn btn-sm ${activeTab === "users" ? "btn-primary" : "btn-ghost"}`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab("password-reset")}
            className={`btn btn-sm ${activeTab === "password-reset" ? "btn-primary" : "btn-ghost"}`}
          >
            <Key className="w-4 h-4" />
            Password Reset
          </button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-base-100 rounded-2xl shadow-xl overflow-hidden"
        >
          {activeTab === "users" && (
            <>
              {/* Search */}
              <div className="p-4 border-b border-base-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input input-bordered w-full pl-10"
                  />
                </div>
              </div>

              {/* Users Table - Scrollable */}
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="table table-zebra">
                  <thead className="sticky top-0 bg-base-100 z-10">
                    <tr>
                      <th>User</th>
                      <th className="hidden sm:table-cell">Username</th>
                      <th className="hidden md:table-cell">Email</th>
                      <th>Badge</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {user.fullName}
                                <Badge badgeType={user.badgeType} size="sm" />
                              </div>
                              <div className="text-xs text-base-content/60 sm:hidden">
                                @{user.username || "no-username"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="text-sm">@{user.username || "—"}</span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-sm">{user.email}</span>
                        </td>
                        <td>
                          {user.badgeType && user.badgeType !== "none" ? (
                            <span className={`badge badge-sm bg-gradient-to-r ${ALL_BADGES[user.badgeType]?.color} text-white`}>
                              {ALL_BADGES[user.badgeType]?.name}
                            </span>
                          ) : (
                            <span className="text-xs text-base-content/40">None</span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {user.isPremium && (
                              <span className="badge badge-sm badge-warning">Premium</span>
                            )}
                            {user.isBanned && (
                              <span className="badge badge-sm badge-error">Banned</span>
                            )}
                            {!user.isPremium && !user.isBanned && (
                              <span className="badge badge-sm badge-ghost">Active</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-xs">
                              <ChevronDown className="w-4 h-4" />
                            </label>
                            <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-52">
                              <li>
                                <button onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedBadge(user.badgeType || "none");
                                  setShowBadgeModal(true);
                                }}>
                                  <Star className="w-4 h-4" /> Change Badge
                                </button>
                              </li>
                              <li>
                                <button onClick={() => {
                                  setSelectedUser(user);
                                  setShowPremiumModal(true);
                                }}>
                                  <Crown className="w-4 h-4" /> 
                                  {user.isPremium ? "Remove Premium" : "Give Premium"}
                                </button>
                              </li>
                              <li>
                                <button onClick={() => {
                                  setSelectedUser(user);
                                  setNewUsername(user.username || "");
                                  setShowUsernameModal(true);
                                }}>
                                  <AtSign className="w-4 h-4" /> Change Username
                                </button>
                              </li>
                              <li>
                                <button onClick={() => {
                                  setSelectedUser(user);
                                  setShowPasswordModal(true);
                                }}>
                                  <Key className="w-4 h-4" /> Reset Password
                                </button>
                              </li>
                              <li>
                                <button onClick={() => handleToggleBan(user)}>
                                  {user.isBanned ? (
                                    <><Unlock className="w-4 h-4" /> Unban</>
                                  ) : (
                                    <><Ban className="w-4 h-4" /> Ban</>
                                  )}
                                </button>
                              </li>
                              <li>
                                <button 
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-error"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete User
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-10 text-base-content/60">
                    No users found
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "password-reset" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Reset User Password</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Search for a user by their username or email to reset their password.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Enter username or email..."
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    className="input input-bordered w-full pl-10"
                  />
                </div>
                <button onClick={handleLookupUser} className="btn btn-primary">
                  <Search className="w-4 h-4" />
                  Find User
                </button>
              </div>

              {foundUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-base-200 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={foundUser.profilePic || "/avatar.png"}
                      alt={foundUser.fullName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {foundUser.fullName}
                        <Badge badgeType={foundUser.badgeType} size="sm" />
                      </h4>
                      <p className="text-sm text-base-content/60">
                        @{foundUser.username} • {foundUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="New password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input input-bordered flex-1"
                    />
                    <button
                      onClick={handleResetPassword}
                      disabled={!newPassword || newPassword.length < 6}
                      className="btn btn-primary"
                    >
                      <Key className="w-4 h-4" />
                      Reset Password
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Badge Modal */}
      <AnimatePresence>
        {showBadgeModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBadgeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                Change Badge for {selectedUser.fullName}
              </h3>
              
              <BadgeSelector
                selectedBadge={selectedBadge}
                onSelect={setSelectedBadge}
                isAdmin={true}
              />

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowBadgeModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={handleUpdateBadge} className="btn btn-primary">
                  <Save className="w-4 h-4" />
                  Save Badge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                Reset Password for {selectedUser.fullName}
              </h3>
              
              <input
                type="text"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input input-bordered w-full mb-4"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPasswordModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!newPassword || newPassword.length < 6}
                  className="btn btn-primary"
                >
                  <Key className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Username Modal */}
      <AnimatePresence>
        {showUsernameModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUsernameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                Change Username for {selectedUser.fullName}
              </h3>
              
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="New username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="input input-bordered w-full pl-10 mb-4"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowUsernameModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUsername}
                  disabled={!newUsername || newUsername.length < 3}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                {selectedUser.isPremium ? "Remove" : "Give"} Premium
              </h3>
              
              {!selectedUser.isPremium && (
                <div className="mb-4">
                  <label className="label">
                    <span className="label-text">Premium Duration (days)</span>
                  </label>
                  <select
                    value={premiumDays}
                    onChange={(e) => setPremiumDays(Number(e.target.value))}
                    className="select select-bordered w-full"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                    <option value={36500}>Lifetime</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPremiumModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={handleTogglePremium} className="btn btn-warning">
                  <Crown className="w-4 h-4" />
                  {selectedUser.isPremium ? "Remove Premium" : "Give Premium"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2 text-error">Delete User</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Are you sure you want to delete <strong>{selectedUser.fullName}</strong>? 
                This will also delete all their messages. This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={handleDeleteUser} className="btn btn-error">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
