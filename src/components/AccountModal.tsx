import React, { useState, useEffect } from 'react';
import { UserAccount, GameSave, Achievement } from '../types';
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
  Flame,
  Check,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEscapeKey } from '../lib/hooks';
import { SteamPanel } from './SteamPanel';

interface AccountModalProps {
  currentUser: UserAccount | null;
  onClose: () => void;
  onUpdateUser: (user: UserAccount | null) => void;
  initialTab?: 'profile' | 'signin' | 'register' | 'steam' | 'saves' | 'security' | 'switch';
}

/*
 * Generated marks, not stock photography. The old presets pulled portraits from Unsplash —
 * an external host the hub does not control, and faces sit oddly in a system that prints
 * every other image in black and white.
 */
// Every style here was checked against the API — `beam` and `glass` are not DiceBear 7.x
// styles and 404, which renders as a broken image in the picker.
const AVATAR_STYLES = [
  'bottts', 'pixel-art', 'identicon', 'shapes', 'rings', 'thumbs',
  'avataaars', 'notionists', 'adventurer', 'lorelei', 'micah', 'miniavs',
  'open-peeps', 'personas', 'big-ears', 'croodles', 'fun-emoji', 'big-smile'
];

/*
 * Generated marks, not stock photography. The old presets pulled portraits from Unsplash —
 * an external host the hub does not control, and faces sit oddly in a system that prints
 * every other image in black and white. Two seeds per style gives a decent spread without
 * turning the picker into a wall.
 */
const AVATAR_PRESETS = AVATAR_STYLES.flatMap(style =>
  ['a', 'b'].map(seed => ({
    name: style.replace(/-/g, ' '),
    url: `https://api.dicebear.com/7.x/${style}/svg?seed=flashhub-${style}-${seed}`
  }))
);

export function AccountModal({
  currentUser,
  onClose,
  onUpdateUser,
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

  // The achievement catalogue, so the profile can show what is still locked rather than
  // repeating the server's list in a hardcoded if-chain that drifts from it.
  const [achievementCatalog, setAchievementCatalog] = useState<Achievement[]>([]);

  /** Minutes as something a person reads: "3h 12m", "45m", "—" for nothing yet. */
  const formatPlaytime = (minutes: number): string => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (!hours) return `${mins}m`;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const earnedIds = new Set((currentUser?.achievements || []).map(a => a.achievementId));

  useEscapeKey(onClose);

  // Update edit form values when user changes
  useEffect(() => {
    if (currentUser) {
      setEditDisplayName(currentUser.displayName || currentUser.username);
      setEditBio(currentUser.bio || '');
      setEditAvatar(currentUser.avatarUrl);
    }
  }, [currentUser]);

  // Load the player directory. It is only rendered on the "switch account" tab, which only
  // exists for a signed-in player — and the endpoint now requires a session either way.
  useEffect(() => {
    if (!currentUser) {
      setAllAccounts([]);
      return;
    }
    fetch('/api/accounts')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d && d.status === 'ok') {
          setAllAccounts(d.data || []);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    fetch('/api/achievements')
      .then(res => (res.ok ? res.json() : null))
      .then(d => { if (d?.status === 'ok') setAchievementCatalog(d.data || []); })
      .catch(() => { /* the profile falls back to showing only what was earned */ });
  }, []);

  // Load user saves when viewing saves tab
  useEffect(() => {
    if (currentUser?.id && activeTab === 'saves') {
      setSavesLoading(true);
      fetch(`/api/saves?userId=${encodeURIComponent(currentUser.id)}`)
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

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = { error: `Server returned status ${res.status}` };
      }

      if (!res.ok || data?.status !== 'ok') {
        throw new Error(data?.error || 'Login failed. Please check your credentials.');
      }

      onUpdateUser(data.user);
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
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters');
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

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = { error: `Server returned status ${res.status}` };
      }

      if (!res.ok || data?.status !== 'ok') {
        throw new Error(data?.error || 'Registration failed');
      }

      onUpdateUser(data.user);
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
      // Clears the session server-side and expires the cookie
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      onUpdateUser(null);
      setActiveTab('signin');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setProfileSaving(true);
    setProfileMessage('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName,
          bio: editBio,
          avatarUrl: editAvatar
        })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser(data.user);
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

  // Handle Unlink Steam
  const handleUnlinkSteam = async () => {
    setSteamLoading(true);
    setSteamError('');
    setSteamSuccess('');

    try {
      const res = await fetch('/api/auth/unlink-steam', {
        method: 'POST',

      });
      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser(data.user);
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

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser(null);
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
      const res = await fetch(`/api/saves/${saveId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Could not delete this save slot');
        return;
      }
      setUserSaves(prev => prev.filter(s => s.id !== saveId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="sheet w-full max-w-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rule flex items-center justify-between bg-shade/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt="Avatar"
                className="w-11 h-11 object-cover bg-shade ring-hair"
              />
              {currentUser?.steamId && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#66c0f4] ring-ink" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink tracking-tight">
                  {currentUser?.displayName || currentUser?.username || 'Guest Player'}
                </h3>
                {currentUser?.role === 'admin' && (
                  <span className="px-2 py-0.5 text-[12px] font-semibold bg-accent/15 border border-accent/30 text-accent-lit">
                    Admin
                  </span>
                )}
                {currentUser && (
                  <span className="text-xs text-ink/60 tabular-nums">
                    @{currentUser.username}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink/60">
                {currentUser?.email || 'Sign in or register for persistent cloud saves'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-shade hover:bg-accent/10 hover:text-accent-lit text-ink/60 border border-rule hover:border-accent/25 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Sign out of this session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 btn-ghost hover:text-ink flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-rule bg-shade/30 px-4 pt-2 gap-1 sm:gap-2 text-xs font-medium overflow-x-auto">
          {currentUser ? (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-2.5 px-3 border-b transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-rule text-ink font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('steam')}
                className={`pb-2.5 px-3 border-b flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === 'steam'
                    ? 'border-[#66c0f4] text-[#66c0f4] font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#66c0f4]" />
                Steam Link
              </button>
              <button
                onClick={() => setActiveTab('saves')}
                className={`pb-2.5 px-3 border-b transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'saves'
                    ? 'border-accent text-accent-lit font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <Save className="w-3.5 h-3.5 text-accent-lit" />
                Game Saves ({userSaves.length || currentUser.savesCount || 0})
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-2.5 px-3 border-b transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-accent text-accent-lit font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-accent-lit" />
                Security & Password
              </button>
              <button
                onClick={() => setActiveTab('switch')}
                className={`pb-2.5 px-3 border-b transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'switch'
                    ? 'border-rule text-ink font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
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
                className={`pb-2.5 px-4 border-b transition-colors flex items-center gap-1.5 ${
                  activeTab === 'signin'
                    ? 'border-rule text-ink font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`pb-2.5 px-4 border-b transition-colors flex items-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'border-accent text-accent-lit font-semibold'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Real Account
              </button>
            </>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-ink/80">
          
          {/* --- TAB: SIGN IN --- */}
          {activeTab === 'signin' && (
            <div className="max-w-md mx-auto py-2 space-y-6">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-ink">Sign In to FlashHub</h4>
                <p className="text-xs text-ink/60">Access your cloud saves, high scores, and Steam synced profile.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-accent/10 border border-accent/30 text-accent-lit text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your username or email"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="field w-full px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="field w-full pl-3.5 pr-10 py-2.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/55 hover:text-ink/80"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 btn-primary font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {loginLoading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-ink/60 hover:text-ink transition-colors"
                >
                  Don't have an account? <span className="text-accent-lit font-medium underline">Create one now</span>
                </button>
              </div>
            </div>
          )}

          {/* --- TAB: REGISTER --- */}
          {activeTab === 'register' && (
            <div className="max-w-lg mx-auto py-1 space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-ink">Create a Real FlashHub Account</h4>
                <p className="text-xs text-ink/60">Save states to the cloud, track high scores, and link your Steam profile.</p>
              </div>

              {regError && (
                <div className="p-3 bg-accent/10 border border-accent/30 text-accent-lit text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">
                      Username <span className="text-accent-lit">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PixelMaster"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      className="field w-full px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Player"
                      value={regDisplayName}
                      onChange={e => setRegDisplayName(e.target.value)}
                      className="field w-full px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1">
                    Email Address <span className="text-accent-lit">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="field w-full px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">
                      Password (min 8 chars) <span className="text-accent-lit">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="field w-full pl-3 pr-9 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(p => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/55 hover:text-ink/80"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">
                      Confirm Password <span className="text-accent-lit">*</span>
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className="field w-full px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-2">
                    Choose Profile Avatar
                  </label>
                  <div className="grid grid-cols-9 sm:grid-cols-12 gap-1.5 max-h-[152px] overflow-y-auto pr-1">
                    {AVATAR_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRegAvatar(preset.url)}
                        className={`relative flex-shrink-0 w-10 h-10 overflow-hidden border transition-colors ${
                          regAvatar === preset.url ? 'border-accent scale-105  ring-accent/20' : 'border-rule hover:border-rule'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover bg-shade" />
                        {regAvatar === preset.url && (
                          <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-accent-lit" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1">
                    Bio / Status (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Speedrunning Flash classics & Steam ports"
                    value={regBio}
                    onChange={e => setRegBio(e.target.value)}
                    className="field w-full px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="btn-primary w-full py-2.5 px-4 text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {regLoading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  onClick={() => setActiveTab('signin')}
                  className="text-xs text-ink/60 hover:text-ink transition-colors"
                >
                  Already have an account? <span className="text-ink font-medium underline">Sign in instead</span>
                </button>
              </div>
            </div>
          )}

          {/* --- TAB: PROFILE OVERVIEW (LOGGED IN) --- */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-6">
              {profileMessage && (
                <div className="p-3 bg-accent/10 border border-accent/30 text-accent-lit text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {profileMessage}
                </div>
              )}

              {/* Profile Card & Edit Mode */}
              {!isEditingProfile ? (
                <div className="p-5 border border-rule bg-shade flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-16 h-16 object-cover bg-shade border border-rule"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-ink">
                          {currentUser.displayName || currentUser.username}
                        </h3>
                        <span className="text-xs text-ink/60 tabular-nums">@{currentUser.username}</span>
                      </div>
                      <p className="text-xs text-ink/80 mt-1 max-w-md leading-relaxed">
                        {currentUser.bio || 'No bio set.'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-ink/55 tabular-nums mt-2">
                        <span>Joined: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Role: <strong className="text-ink/80">{currentUser.role}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-3.5 py-2 bg-shade hover:bg-shade text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors self-stretch sm:self-auto justify-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="p-5 border border-rule bg-shade space-y-4">
                  <div className="flex items-center justify-between border-b border-rule pb-3">
                    <h4 className="text-xs font-bold text-ink">Edit Profile Details</h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-xs text-ink/60 hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={e => setEditDisplayName(e.target.value)}
                      className="field w-full px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">Bio / Status</label>
                    <input
                      type="text"
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      className="field w-full px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-2">Avatar Preset or Custom URL</label>
                    <div className="grid grid-cols-9 sm:grid-cols-12 gap-1.5 max-h-[152px] overflow-y-auto pr-1">
                      {AVATAR_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditAvatar(preset.url)}
                          className={`relative flex-shrink-0 w-10 h-10  overflow-hidden border transition-colors ${
                            editAvatar === preset.url ? 'border-rule  ring-hair' : 'border-rule hover:border-rule'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover bg-shade" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste custom image URL"
                      value={editAvatar}
                      onChange={e => setEditAvatar(e.target.value)}
                      className="field w-full px-3 py-1.5 mt-2 text-[11px] tabular-nums"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 bg-shade hover:bg-shade text-xs text-ink/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-4 py-1.5 btn-primary font-bold text-xs"
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* The four figures a profile is actually about, on the system's stat band */}
              <div className="grid grid-cols-2 lg:grid-cols-4 border border-rule">
                {[
                  {
                    label: 'Playtime',
                    value: formatPlaytime(currentUser.totalPlaytimeMinutes || 0)
                  },
                  {
                    label: 'Save slots',
                    value: String(userSaves.length || currentUser.savesCount || 0)
                  },
                  {
                    label: 'Achievements',
                    value: `${earnedIds.size}/${achievementCatalog.length || earnedIds.size}`
                  },
                  {
                    label: 'Member since',
                    value: new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric'
                    })
                  }
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={`px-4 py-3.5 border-rule ${i % 2 === 0 ? 'border-r' : ''} ${
                      i < 2 ? 'border-b lg:border-b-0' : ''
                    } lg:border-r lg:last:border-r-0`}
                  >
                    <div className="eyebrow mb-1.5">{label}</div>
                    <div className="font-display text-[20px] font-extrabold leading-none text-ink">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Achievements — the whole catalogue, so the locked ones read as goals */}
              <div className="pt-2">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent-lit" />
                    <h4 className="text-sm font-bold text-ink">Achievements</h4>
                  </div>
                  <span className="tabular-nums text-[11px] text-ink/55">
                    {earnedIds.size} / {achievementCatalog.length || earnedIds.size} unlocked
                  </span>
                </div>

                {achievementCatalog.length === 0 ? (
                  <div className="p-4 border border-dashed border-rule">
                    <p className="text-xs text-ink/55">Achievement list unavailable.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {achievementCatalog.map(ach => {
                      const earned = currentUser.achievements?.find(a => a.achievementId === ach.id);
                      return (
                        <div
                          key={ach.id}
                          className={`flex items-start gap-3 p-3 border ${
                            earned ? 'border-accent bg-accent/5' : 'border-rule bg-shade opacity-60'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 flex items-center justify-center text-lg border flex-shrink-0 ${
                              earned ? 'border-accent bg-paper' : 'border-rule bg-paper grayscale'
                            }`}
                          >
                            {ach.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink">{ach.name}</div>
                            <div className="text-[12px] text-ink/60 leading-relaxed">{ach.description}</div>
                            <div className="text-[12px] tabular-nums text-ink/60 mt-1">
                              {earned
                                ? `Unlocked ${new Date(earned.earnedAt).toLocaleDateString()}`
                                : 'Locked'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Steam Showcase Card */}
              {currentUser.steamId ? (
                <div className="p-5 bg-[#171a21]/90 border border-[#2a475e] relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={currentUser.steamAvatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                        alt="Steam Avatar"
                        className="w-14 h-14 border border-[#66c0f4]/40 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-ink">
                            {currentUser.steamPersonaName || 'Steam User'}
                          </span>
                          {typeof currentUser.steamLevel === 'number' && (
                            <span className="chip chip-quiet">Steam level {currentUser.steamLevel}</span>
                          )}
                        </div>
                        <p className="text-xs text-ink/60 tabular-nums mt-0.5">
                          SteamID64: {currentUser.steamId}
                        </p>
                        <p className="text-xs text-ink/60 mt-1">
                          {currentUser.steamVerifiedAt
                            ? `Confirmed by Steam on ${new Date(currentUser.steamVerifiedAt).toLocaleDateString()}`
                            : 'Not yet confirmed with Steam'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      {currentUser.steamProfileUrl && (
                        <a
                          href={currentUser.steamProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#2a475e]/60 hover:bg-[#2a475e] text-xs font-medium text-ink transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Steam Profile
                        </a>
                      )}
                      <button
                        onClick={() => setActiveTab('steam')}
                        className="px-3 py-2 bg-ink/10 hover:bg-ink/12 text-xs font-medium text-ink transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 border border-rule bg-shade text-center space-y-3">
                  <div className="w-12 h-12 bg-[#171a21] border border-[#2a475e] mx-auto flex items-center justify-center text-[#66c0f4]">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Add your Steam library</h4>
                    <p className="text-xs text-ink/60 max-w-md mx-auto mt-1">
                      Sign in through Steam and your Steam games, playtime and achievements join your Flashhub library. They open in the Steam client.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('steam')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b2838] hover:bg-[#2a475e] text-[#66c0f4] border border-[#2a475e] text-xs font-semibold transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link Steam
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: STEAM LINKING --- */}
          {activeTab === 'steam' && currentUser && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-ink">Steam</h4>
                <p className="text-xs text-ink/60 leading-relaxed max-w-[60ch]">
                  Flashhub links a Steam account only when Steam confirms it is yours: you sign in on
                  Steam’s own page and Steam tells Flashhub your account id. Flashhub never sees your
                  Steam password. Library, playtime and achievements also need a Steam Web API key on
                  this server and public game details on your Steam profile.
                </p>
              </div>

              {steamSuccess && (
                <div className="p-3 bg-shade text-ink text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-accent-lit" />
                  {steamSuccess}
                </div>
              )}

              {steamError && <div className="p-3 bg-shade text-accent-lit text-xs">{steamError}</div>}

              {currentUser?.steamId && !currentUser.steamVerifiedAt && (
                <div className="p-4 bg-shade text-xs leading-relaxed text-ink">
                  This Steam account ({currentUser.steamPersonaName || currentUser.steamId}) was linked
                  before Flashhub could check who owns it. It keeps working, but please confirm it:
                  sign in through Steam with the same account. If Steam signs you in as a different
                  account, that one replaces it.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <a href="/api/auth/steam/start" className="btn-primary h-10 px-4 text-[13px]">
                  <LinkIcon className="w-4 h-4" aria-hidden />
                  {!currentUser?.steamId
                    ? 'Sign in through Steam'
                    : currentUser.steamVerifiedAt
                      ? 'Switch Steam account'
                      : 'Confirm with Steam'}
                </a>
                {currentUser?.steamId && (
                  <button
                    type="button"
                    onClick={handleUnlinkSteam}
                    disabled={steamLoading}
                    className="btn-ghost h-10 px-4 text-[13px]"
                  >
                    <Unlink className="w-4 h-4" aria-hidden />
                    Unlink
                  </button>
                )}
              </div>
              {currentUser?.steamId && (
                <p className="text-xs text-ink/60">
                  Linked to Steam account <span className="text-ink tabular-nums">{currentUser.steamId}</span>
                  {currentUser.steamVerifiedAt ? `, confirmed by Steam on ${new Date(currentUser.steamVerifiedAt).toLocaleDateString()}.` : ', not yet confirmed.'}
                </p>
              )}

              {/* Library, playtime and achievements for the linked account */}
              <SteamPanel steamId={currentUser?.steamId} />
            </div>
          )}

          {/* --- TAB: CLOUD SAVES --- */}
          {activeTab === 'saves' && currentUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink">Cloud Save Keeper</h4>
                  <p className="text-xs text-ink/60">All progress, checkpoints, and save states linked to your authenticated account.</p>
                </div>

                <a
                  href="/api/saves/export-all"
                  download="flashhub-cloud-saves.json"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-ink/10 hover:bg-ink/12 text-xs text-ink transition-colors font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export All (.JSON)
                </a>
              </div>

              {savesLoading ? (
                <div className="py-12 text-center text-xs text-ink/55">Loading your save states...</div>
              ) : userSaves.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-rule space-y-2">
                  <Save className="w-8 h-8 text-ink/60 mx-auto" />
                  <p className="text-xs text-ink/60 font-medium">No cloud saves stored yet.</p>
                  <p className="text-[11px] text-ink/55 max-w-xs mx-auto">
                    Launch any game port or flash classic and click "Save State" in the bottom control bar to create your first cloud save slot!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userSaves.map(save => (
                    <div
                      key={save.id}
                      className="p-3.5 bg-shade/60 border border-rule flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-accent/10 border border-accent/25 flex items-center justify-center text-accent-lit">
                          <Save className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">{save.gameTitle}</span>
                            <span className="px-2 py-0.5 text-[12px] tabular-nums bg-shade text-ink/80">
                              {save.slotName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-ink/60 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-ink/55" />
                              {new Date(save.timestamp).toLocaleString()}
                            </span>
                            {save.highScore !== undefined && (
                              <span className="text-accent-lit font-semibold">
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
                          className="p-2 bg-shade hover:bg-shade text-ink/80 hover:text-ink transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSave(save.id)}
                          title="Delete save slot"
                          className="p-2 bg-accent/10 hover:bg-accent/20 text-accent-lit transition-colors"
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
                <h4 className="text-sm font-bold text-ink mb-1">Account Security & Credentials</h4>
                <p className="text-xs text-ink/60">Change your password and manage active account security settings.</p>
              </div>

              {passwordMessage && (
                <div className="p-3 bg-accent/10 border border-accent/30 text-accent-lit text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {passwordMessage}
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-accent/10 border border-accent/30 text-accent-lit text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {passwordError}
                </div>
              )}

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="p-5 bg-shade/60 border border-rule space-y-4">
                <h5 className="text-xs font-bold text-ink flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-accent-lit" />
                  Change Password
                </h5>

                <div>
                  <label className="block text-xs font-semibold text-ink/80 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="field w-full px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      required
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="field w-full px-3.5 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      className="field w-full px-3.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 btn-primary font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              {/* Danger Zone: Delete Account */}
              <div className="p-5 bg-accent/10 border border-accent/30 space-y-3">
                <h5 className="text-xs font-bold text-accent-lit flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Danger Zone: Delete Account
                </h5>
                <p className="text-xs text-ink/60 leading-relaxed">
                  Permanently remove this account and all associated cloud save slots. This action cannot be undone.
                </p>

                {deleteError && (
                  <div className="p-2.5 bg-accent/10 border border-accent/30 text-accent-lit text-xs">
                    {deleteError}
                  </div>
                )}

                <form onSubmit={handleDeleteAccount} className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter password to confirm deletion"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="field flex-1 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={deleteLoading || !deletePassword}
                    className="px-4 py-2 bg-accent hover:bg-accent text-ink font-bold text-xs transition-colors disabled:opacity-50"
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
                <h4 className="text-sm font-bold text-ink mb-1">Switch User Session</h4>
                <p className="text-xs text-ink/60">Log into another account or switch to another user on this device.</p>
              </div>

              {/* Available accounts directory */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink/60 block">Registered Players</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAccounts.map(acc => (
                    <div
                      key={acc.id}
                      className={`p-3  border text-left flex items-center justify-between gap-3 transition-colors ${
                        currentUser?.id === acc.id
                          ? 'bg-ink/10 border-rule text-ink'
                          : 'bg-shade/50 border-rule text-ink/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={acc.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                          alt={acc.username}
                          className="w-8 h-8 bg-shade object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold leading-none">{acc.displayName || acc.username}</div>
                          <div className="text-[12px] text-ink/60 mt-1 tabular-nums">@{acc.username} • {acc.role}</div>
                        </div>
                      </div>

                      {currentUser?.id === acc.id ? (
                        <span className="text-[12px] font-bold text-accent-lit px-2 py-0.5 bg-accent/10 border border-accent/25">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setLoginIdentifier(acc.username);
                            setActiveTab('signin');
                          }}
                          className="px-2.5 py-1 btn-ghost text-xs font-medium"
                        >
                          Sign In
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-rule flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 btn-primary font-bold text-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create New Account
                </button>
                <button
                  onClick={() => setActiveTab('signin')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 btn-ghost font-medium text-xs transition-colors"
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
