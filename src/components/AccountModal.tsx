import React, { useState, useEffect } from 'react';
import { UserAccount, GameSave } from '../types';
import {
  X,
  User,
  Shield,
  Gamepad2,
  ExternalLink,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  Save,
  LogIn,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  Settings,
  Flame,
  Check,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccountModalProps {
  currentUser: UserAccount | null;
  onClose: () => void;
  onUpdateUser: (user: UserAccount | null, token?: string) => void;
  authToken: string | null;
  initialTab?: 'profile' | 'signin' | 'register' | 'steam' | 'saves' | 'security' | 'switch';
}

const AVATAR_PRESETS = [
  { name: 'Cyber Bot', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80' },
  { name: 'Retro Gamer', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80' },
  { name: 'Arcade Pixel', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' },
  { name: 'Neon Samurai', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' },
  { name: 'Synthwave', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80' },
  { name: '8-Bit Hero', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=hero' },
  { name: 'Pixel Fox', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=fox' },
  { name: 'Mecha', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=mecha' }
];

export function AccountModal({
  currentUser,
  onClose,
  onUpdateUser,
  authToken,
  initialTab = 'profile'
}: AccountModalProps) {
  // Determine starting tab
  const [activeTab, setActiveTab] = useState<'profile' | 'signin' | 'register' | 'steam' | 'saves' | 'security' | 'switch'>(
    !currentUser ? (initialTab === 'register' ? 'register' : 'signin') : initialTab
  );

  // Authentication State (Sign In)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Authentication State (Register)
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regAvatar, setRegAvatar] = useState(AVATAR_PRESETS[0].url);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatarUrl || AVATAR_PRESETS[0].url);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Steam linking state
  const [steamInput, setSteamInput] = useState(currentUser?.steamId || '');
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamError, setSteamError] = useState('');
  const [steamSuccess, setSteamSuccess] = useState('');

  // Saves state
  const [userSaves, setUserSaves] = useState<GameSave[]>([]);
  const [savesLoading, setSavesLoading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete Account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Switch / Accounts Directory
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>([]);

  // Update edit form values when user changes
  useEffect(() => {
    if (currentUser) {
      setEditDisplayName(currentUser.displayName || currentUser.username);
      setEditBio(currentUser.bio || '');
      setEditAvatar(currentUser.avatarUrl);
      setSteamInput(currentUser.steamId || '');
    }
  }, [currentUser]);

  // Load public accounts list
  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d && d.status === 'ok') {
          setAllAccounts(d.data || []);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  // Load user saves when viewing saves tab
  useEffect(() => {
    if (currentUser?.id && activeTab === 'saves') {
      setSavesLoading(true);
      fetch(`/api/saves?userId=${currentUser.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(d => {
          if (d && d.status === 'ok') {
            setUserSaves(d.data || []);
          }
        })
        .catch(() => {})
        .finally(() => setSavesLoading(false));
    }
  }, [currentUser?.id, activeTab]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Please enter both username/email and password');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      onUpdateUser(data.user, data.token);
      setActiveTab('profile');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regUsername.trim().length < 3) {
      setRegError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(regUsername.trim())) {
      setRegError('Username can only contain letters, numbers, hyphens and underscores');
      return;
    }
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegError('Please enter a valid email address');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          displayName: regDisplayName.trim() || regUsername.trim(),
          bio: regBio.trim(),
          avatarUrl: regAvatar
        })
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.error || 'Registration failed');
      }

      onUpdateUser(data.user, data.token);
      setActiveTab('profile');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      onUpdateUser(null, undefined);
      setActiveTab('signin');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !currentUser) return;

    setProfileSaving(true);
    setProfileMessage('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          displayName: editDisplayName,
          bio: editBio,
          avatarUrl: editAvatar
        })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser(data.user, authToken);
        setIsEditingProfile(false);
        setProfileMessage('Profile updated successfully!');
        setTimeout(() => setProfileMessage(''), 4000);
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setProfileMessage(`Error: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Steam Linking
  const handleLinkSteam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamInput.trim() || !authToken) return;

    setSteamLoading(true);
    setSteamError('');
    setSteamSuccess('');

    try {
      const lookupRes = await fetch(`/api/steam/lookup?query=${encodeURIComponent(steamInput.trim())}`);
      const lookupData = await lookupRes.json();

      if (!lookupRes.ok || lookupData.status !== 'ok') {
        throw new Error(lookupData.error || 'Failed to lookup Steam profile');
      }

      const steamData = lookupData.data;

      const linkRes = await fetch('/api/auth/link-steam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(steamData)
      });

      const linkData = await linkRes.json();
      if (linkData.status === 'ok') {
        onUpdateUser(linkData.user, authToken);
        setSteamSuccess(`Successfully linked Steam profile "${steamData.steamPersonaName}"!`);
      } else {
        throw new Error(linkData.error || 'Could not link Steam account');
      }
    } catch (err: any) {
      setSteamError(err.message || 'Error connecting to Steam');
    } finally {
      setSteamLoading(false);
    }
  };

  // Handle Unlink Steam
  const handleUnlinkSteam = async () => {
    if (!authToken) return;
    setSteamLoading(true);
    setSteamError('');
    setSteamSuccess('');

    try {
      const res = await fetch('/api/auth/unlink-steam', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser(data.user, authToken);
        setSteamInput('');
        setSteamSuccess('Steam account unlinked.');
      } else {
        throw new Error(data.error || 'Failed to unlink');
      }
    } catch (err: any) {
      setSteamError(err.message);
    } finally {
      setSteamLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        setPasswordMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you absolutely sure you want to permanently delete your account and all saves? This cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser(null, undefined);
        setActiveTab('signin');
      } else {
        throw new Error(data.error || 'Deletion failed');
      }
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Delete Save Slot
  const handleDeleteSave = async (saveId: string) => {
    if (!confirm('Delete this cloud save slot?')) return;
    try {
      await fetch(`/api/saves/${saveId}`, { method: 'DELETE' });
      setUserSaves(prev => prev.filter(s => s.id !== saveId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt="Avatar"
                className="w-11 h-11 rounded-full object-cover bg-zinc-800 ring-2 ring-white/10"
              />
              {currentUser?.steamId && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#66c0f4] ring-2 ring-black" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentUser?.displayName || currentUser?.username || 'Guest Player'}
                </h3>
                {currentUser?.role === 'admin' && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded">
                    Admin
                  </span>
                )}
                {currentUser && (
                  <span className="text-xs text-zinc-400 font-mono">
                    @{currentUser.username}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {currentUser?.email || 'Sign in or register for persistent cloud saves'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/10 hover:text-red-300 text-zinc-400 border border-zinc-800 hover:border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Sign out of this session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/30 px-4 pt-2 gap-1 sm:gap-2 text-xs font-medium overflow-x-auto">
          {currentUser ? (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('steam')}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'steam'
                    ? 'border-[#66c0f4] text-[#66c0f4] font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#66c0f4]" />
                Steam Link
              </button>
              <button
                onClick={() => setActiveTab('saves')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'saves'
                    ? 'border-emerald-400 text-emerald-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                Game Saves ({userSaves.length || currentUser.savesCount || 0})
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-amber-400 text-amber-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Security & Password
              </button>
              <button
                onClick={() => setActiveTab('switch')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'switch'
                    ? 'border-cyan-400 text-cyan-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Switch Account
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('signin')}
                className={`pb-2.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'signin'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`pb-2.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'border-emerald-400 text-emerald-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Real Account
              </button>
            </>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-zinc-300">
          
          {/* --- TAB: SIGN IN --- */}
          {activeTab === 'signin' && (
            <div className="max-w-md mx-auto py-2 space-y-6">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-white">Sign In to FlashHub</h4>
                <p className="text-xs text-zinc-400">Access your cloud saves, high scores, and Steam synced profile.</p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin or player@example.com"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {loginLoading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Don't have an account? <span className="text-emerald-400 font-medium underline">Create one now</span>
                </button>
              </div>
            </div>
          )}

          {/* --- TAB: REGISTER --- */}
          {activeTab === 'register' && (
            <div className="max-w-lg mx-auto py-1 space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-white">Create a Real FlashHub Account</h4>
                <p className="text-xs text-zinc-400">Save states to the cloud, track high scores, and link your Steam profile.</p>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Username <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PixelMaster"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Player"
                      value={regDisplayName}
                      onChange={e => setRegDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="player@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Password (min 6 chars) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(p => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                    />
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Choose Profile Avatar
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {AVATAR_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRegAvatar(preset.url)}
                        className={`relative flex-shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                          regAvatar === preset.url ? 'border-emerald-400 scale-105 ring-2 ring-emerald-400/20' : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover bg-zinc-800" />
                        {regAvatar === preset.url && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-300" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Bio / Status (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Speedrunning Flash classics & Steam ports"
                    value={regBio}
                    onChange={e => setRegBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {regLoading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  onClick={() => setActiveTab('signin')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Already have an account? <span className="text-white font-medium underline">Sign in instead</span>
                </button>
              </div>
            </div>
          )}

          {/* --- TAB: PROFILE OVERVIEW (LOGGED IN) --- */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-6">
              {profileMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {profileMessage}
                </div>
              )}

              {/* Profile Card & Edit Mode */}
              {!isEditingProfile ? (
                <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-16 h-16 rounded-2xl object-cover bg-zinc-800 border border-zinc-700 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {currentUser.displayName || currentUser.username}
                        </h3>
                        <span className="text-xs text-zinc-400 font-mono">@{currentUser.username}</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 max-w-md leading-relaxed">
                        {currentUser.bio || 'No bio set.'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono mt-2">
                        <span>Joined: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Role: <strong className="text-zinc-300 uppercase">{currentUser.role}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all self-stretch sm:self-auto justify-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Edit Profile Details</h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={e => setEditDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Bio / Status</label>
                    <input
                      type="text"
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-2">Avatar Preset or Custom URL</label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {AVATAR_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditAvatar(preset.url)}
                          className={`relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                            editAvatar === preset.url ? 'border-white ring-2 ring-white/20' : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover bg-zinc-800" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste custom image URL"
                      value={editAvatar}
                      onChange={e => setEditAvatar(e.target.value)}
                      className="w-full px-3 py-1.5 mt-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs"
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Stats Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <span className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider block mb-1">
                    Cloud Saves
                  </span>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-emerald-400" />
                    {userSaves.length || currentUser.savesCount || 0} Slots Active
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <span className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider block mb-1">
                    Steam Connection
                  </span>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-[#66c0f4]" />
                    {currentUser.steamId ? `Level ${currentUser.steamLevel || 25} Linked` : 'Not Connected'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <span className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider block mb-1">
                    Session Security
                  </span>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Encrypted Session
                  </div>
                </div>
              </div>

              {/* Steam Showcase Card */}
              {currentUser.steamId ? (
                <div className="p-5 rounded-2xl bg-[#171a21]/90 border border-[#2a475e] shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={currentUser.steamAvatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                        alt="Steam Avatar"
                        className="w-14 h-14 rounded-xl border border-[#66c0f4]/40 object-cover shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            {currentUser.steamPersonaName || 'Steam User'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/30">
                            Steam Level {currentUser.steamLevel || 25}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                          SteamID64: {currentUser.steamId}
                        </p>
                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Steam Cloud Saves & Library Synced
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      {currentUser.steamProfileUrl && (
                        <a
                          href={currentUser.steamProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a475e]/60 hover:bg-[#2a475e] text-xs font-medium text-white transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Steam Profile
                        </a>
                      )}
                      <button
                        onClick={() => setActiveTab('steam')}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-200 transition-all"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#171a21] border border-[#2a475e] mx-auto flex items-center justify-center text-[#66c0f4]">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Connect Steam Account</h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                      Link your Steam profile to sync your Steam persona, badges, avatar, and cloud save states across all webport cartridges.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('steam')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b2838] hover:bg-[#2a475e] text-[#66c0f4] border border-[#2a475e] text-xs font-semibold shadow-lg transition-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link Steam Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: STEAM LINKING --- */}
          {activeTab === 'steam' && currentUser && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#171a21]/60 border border-[#2a475e]/50">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                  <Gamepad2 className="w-4 h-4 text-[#66c0f4]" />
                  Steam Profile Integration
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter your SteamID64 (e.g. <code className="text-[#66c0f4]">76561198000000000</code>) or Steam vanity profile URL (e.g. <code className="text-[#66c0f4]">https://steamcommunity.com/id/username</code>) to sync your Steam persona and cloud badges.
                </p>
              </div>

              {steamSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {steamSuccess}
                </div>
              )}

              {steamError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {steamError}
                </div>
              )}

              <form onSubmit={handleLinkSteam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Steam ID64 or Custom Profile URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 76561198123456789 or https://steamcommunity.com/id/gaben"
                      value={steamInput}
                      onChange={e => setSteamInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#66c0f4]"
                    />
                    <button
                      type="submit"
                      disabled={steamLoading || !steamInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#66c0f4] hover:bg-[#52aae0] text-black font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {steamLoading ? 'Connecting...' : 'Connect Steam'}
                    </button>
                  </div>
                </div>

                {currentUser?.steamId && (
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="text-xs text-zinc-400">
                      Currently linked to SteamID: <span className="text-zinc-200 font-mono">{currentUser.steamId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlinkSteam}
                      disabled={steamLoading}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Unlink Account
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* --- TAB: CLOUD SAVES --- */}
          {activeTab === 'saves' && currentUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Cloud Save Keeper</h4>
                  <p className="text-xs text-zinc-400">All progress, checkpoints, and save states linked to your authenticated account.</p>
                </div>

                <a
                  href="/api/saves/export-all"
                  download="flashhub-cloud-saves.json"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-200 transition-all font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export All (.JSON)
                </a>
              </div>

              {savesLoading ? (
                <div className="py-12 text-center text-xs text-zinc-500">Loading your save states...</div>
              ) : userSaves.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl space-y-2">
                  <Save className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No cloud saves stored yet.</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Launch any game port or flash classic and click "Save State" in the bottom control bar to create your first cloud save slot!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userSaves.map(save => (
                    <div
                      key={save.id}
                      className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Save className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{save.gameTitle}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                              {save.slotName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {new Date(save.timestamp).toLocaleString()}
                            </span>
                            {save.highScore !== undefined && (
                              <span className="text-amber-300 font-semibold">
                                Score: {save.highScore.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const blob = new Blob([save.saveData], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${save.gameTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${save.slotName}.json`;
                            a.click();
                          }}
                          title="Download raw save file"
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSave(save.id)}
                          title="Delete save slot"
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB: SECURITY & PASSWORD --- */}
          {activeTab === 'security' && currentUser && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Account Security & Credentials</h4>
                <p className="text-xs text-zinc-400">Change your password and manage active account security settings.</p>
              </div>

              {passwordMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {passwordMessage}
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {passwordError}
                </div>
              )}

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Change Password
                </h5>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">New Password (min 6 chars)</label>
                    <input
                      type="password"
                      required
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              {/* Danger Zone: Delete Account */}
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3">
                <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Danger Zone: Delete Account
                </h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Permanently remove this account and all associated cloud save slots. This action cannot be undone.
                </p>

                {deleteError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {deleteError}
                  </div>
                )}

                <form onSubmit={handleDeleteAccount} className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter password to confirm deletion"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-red-900/50 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={deleteLoading || !deletePassword}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB: SWITCH ACCOUNT --- */}
          {activeTab === 'switch' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Switch User Session</h4>
                <p className="text-xs text-zinc-400">Log into another account or switch to another user on this device.</p>
              </div>

              {/* Available accounts directory */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Registered Players</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAccounts.map(acc => (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                        currentUser?.id === acc.id
                          ? 'bg-white/10 border-white text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={acc.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                          alt={acc.username}
                          className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold leading-none">{acc.displayName || acc.username}</div>
                          <div className="text-[10px] text-zinc-400 mt-1 font-mono">@{acc.username} • {acc.role}</div>
                        </div>
                      </div>

                      {currentUser?.id === acc.id ? (
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setLoginIdentifier(acc.username);
                            setActiveTab('signin');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
                        >
                          Sign In
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create New Account
                </button>
                <button
                  onClick={() => setActiveTab('signin')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In with Password
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
