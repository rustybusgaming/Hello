import React, { useState, useEffect } from 'react';
import { Game, UserAccount, GameSave, SystemStats } from '../types';
import {
  Shield,
  X,
  RefreshCw,
  Users,
  Gamepad2,
  Save,
  Server,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { GENIZY_WEBPORT_GAMES } from '../data/webportGames';
import { QUASAR_FLASH_GAMES, QUASAR_HTML5_GAMES, QUASAR_WEBGL_GAMES } from '../data/quasarGames';
import { CURATED_FLASH_COLLECTIONS } from '../data/flashArchives';

interface AdminPanelProps {
  games: Game[];
  onClose: () => void;
  onRefreshGames: () => void;
  currentUser: UserAccount | null;
  authToken: string | null;
}

export function AdminPanel({ games, onClose, onRefreshGames, currentUser, authToken }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'accounts' | 'games' | 'saves'>('sync');

  // Every /api/admin route requires an admin session
  const isAdmin = currentUser?.role === 'admin' && !!authToken;
  const authHeaders = (extra?: Record<string, string>): Record<string, string> => ({
    ...(extra || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  });

  // Stats
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Accounts
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newSteamId, setNewSteamId] = useState('');
  const [accountActionMessage, setAccountActionMessage] = useState('');

  // Games management
  const [gameSearch, setGameSearch] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customThumb, setCustomThumb] = useState('');
  const [customGenres, setCustomGenres] = useState('Web Port, Action');
  const [addGameSuccess, setAddGameSuccess] = useState('');

  // Global Saves
  const [allSaves, setAllSaves] = useState<GameSave[]>([]);
  const [savesLoading, setSavesLoading] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    '[System] Admin Console initialized.',
    `[System] genizy/web-port proxy active (${GENIZY_WEBPORT_GAMES.length} ports available).`,
    `[System] quasar mirror: ${QUASAR_FLASH_GAMES.length + QUASAR_HTML5_GAMES.length + QUASAR_WEBGL_GAMES.length} titles streaming from CDN.`
  ]);

  const appendLog = (message: string) =>
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);

  // Load stats & accounts
  const loadAdminData = async () => {
    try {
      const [statsRes, accRes] = await Promise.all([
        isAdmin
          ? fetch('/api/admin/stats', { headers: authHeaders() }).then(r => r.ok ? r.json() : { status: 'error' })
          : Promise.resolve({ status: 'error' }),
        fetch('/api/accounts', { headers: authHeaders() }).then(r => r.ok ? r.json() : { status: 'error' })
      ]);

      if (statsRes && statsRes.status === 'ok') setStats(statsRes.data);
      if (accRes && accRes.status === 'ok') setAccounts(accRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  // Load global saves if on saves tab
  useEffect(() => {
    if (activeTab === 'saves' && isAdmin) {
      setSavesLoading(true);
      fetch('/api/saves', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && d.status === 'ok') setAllSaves(d.data || []);
        })
        .catch(() => {})
        .finally(() => setSavesLoading(false));
    }
  }, [activeTab, isAdmin]);

  // Trigger Manual Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    appendLog('Triggering manual repository catalog sync...');
    try {
      const res = await fetch('/api/sync', { method: 'POST', headers: authHeaders() });
      const d = await res.json();
      appendLog(res.ok ? `Sync response: ${d.message || d.status}` : `Sync refused: ${d.error}`);
      loadAdminData();
      onRefreshGames();
    } catch (err: any) {
      appendLog(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear Cache
  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/admin/cache/clear', { method: 'POST', headers: authHeaders() });
      const d = await res.json();
      appendLog(res.ok ? `Cache cleared: ${d.message}` : `Cache clear refused: ${d.error}`);
      loadAdminData();
      onRefreshGames();
    } catch (err: any) {
      appendLog(`Cache clear failed: ${err.message}`);
    }
  };

  // Add Account (Admin provision)
  const [newPassword, setNewPassword] = useState('player1234');
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@flashhub.local`,
          password: newPassword || 'player1234',
          displayName: newUsername.trim(),
          role: newRole
        })
      });

      const d = await res.json();
      if (!res.ok || d.status !== 'ok') {
        alert(d.error || 'Failed to create account');
        return;
      }

      let createdUser = d.user;

      // The register endpoint always creates a plain user (only the very first account is
      // promoted), so apply the requested role separately with admin credentials.
      if (newRole === 'admin' && createdUser.role !== 'admin') {
        const roleRes = await fetch(`/api/admin/users/${createdUser.id}/role`, {
          method: 'PUT',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ role: 'admin' })
        });
        const roleData = await roleRes.json();
        if (roleRes.ok && roleData.status === 'ok') {
          createdUser = roleData.data;
        } else {
          appendLog(`Could not grant admin role: ${roleData.error || roleRes.status}`);
        }
      }

      // Link Steam on the new account's own session, if an ID was supplied
      if (newSteamId.trim() && d.token) {
        try {
          const lookupRes = await fetch(`/api/steam/lookup?query=${encodeURIComponent(newSteamId.trim())}`);
          const lookupData = await lookupRes.json();
          if (lookupRes.ok && lookupData.status === 'ok') {
            const linkRes = await fetch('/api/auth/link-steam', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
              body: JSON.stringify(lookupData.data)
            });
            const linkData = await linkRes.json();
            if (linkRes.ok && linkData.status === 'ok') createdUser = linkData.user;
          }
        } catch (linkErr: any) {
          appendLog(`Steam link skipped: ${linkErr.message}`);
        }
      }

      setAccounts(prev => [...prev, createdUser]);
      const usedPassword = newPassword || 'player1234';
      setNewUsername('');
      setNewEmail('');
      setNewSteamId('');
      setNewPassword('player1234');
      setNewRole('user');
      setAccountActionMessage(`Account "${createdUser.username}" created with password "${usedPassword}"!`);
      setTimeout(() => setAccountActionMessage(''), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string, username: string) => {
    if (!confirm(`Delete account "${username}" and all their save states?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(d.error || 'Failed to delete account');
        return;
      }
      setAccounts(prev => prev.filter(a => a.id !== id));
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Role
  const handleToggleRole = async (account: UserAccount) => {
    const nextRole = account.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${account.id}/role`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ role: nextRole })
      });
      const d = await res.json();
      if (res.ok && d.status === 'ok') {
        setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, role: nextRole } : a));
      } else {
        alert(d.error || 'Failed to change role');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Game Hidden
  const handleToggleGame = async (gameId: string, currentHidden: boolean) => {
    try {
      const res = await fetch('/api/admin/games/toggle', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ gameId, hide: !currentHidden })
      });
      const d = await res.json();
      if (res.ok && d.status === 'ok') {
        onRefreshGames();
      } else {
        appendLog(`Could not update game visibility: ${d.error || res.status}`);
      }
    } catch (err: any) {
      console.error('Failed to toggle game:', err);
    }
  };

  // Add Custom Game
  const handleAddCustomGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customUrl.trim()) return;

    try {
      const res = await fetch('/api/admin/games/custom-add', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: customTitle.trim(),
          embedUrl: customUrl.trim(),
          thumbnail: customThumb.trim() || undefined,
          genres: customGenres.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      const d = await res.json();
      if (res.ok && d.status === 'ok') {
        setCustomTitle('');
        setCustomUrl('');
        setCustomThumb('');
        setAddGameSuccess(`Added "${d.data.title}" to catalog!`);
        setTimeout(() => setAddGameSuccess(''), 4000);
        onRefreshGames();
      } else {
        alert(d.error || 'Failed to add game');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Download the full save backup with the admin token attached
  const handleExportSaves = async () => {
    try {
      const res = await fetch('/api/saves/export-all', { headers: authHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to export saves');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flashhub-all-saves-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredGames = games.filter(g =>
    g.title.toLowerCase().includes(gameSearch.toLowerCase()) ||
    g.id.toLowerCase().includes(gameSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-pit border border-edge rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-edge bg-surface/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-flame/10 border border-flame/30 flex items-center justify-center text-flame shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Admin & Sync Operations Center</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-flame/15 text-flame border border-flame/30">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Manage live game ports, user profiles, Steam synchronization, and server status.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg btn-ghost hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin session notice */}
        {!isAdmin && (
          <div className="px-5 py-3 bg-flame/10 border-b border-flame/25 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Signed-in admin session required. Sign in from the account menu with an admin account to
              load server stats and run operations here.
            </span>
          </div>
        )}

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-edge bg-surface/30 divide-x divide-zinc-800/80 text-xs">
          <div className="p-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Games</span>
            <div className="text-sm font-bold text-white mt-0.5">{games.length} Active</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Player Accounts</span>
            <div className="text-sm font-bold text-white mt-0.5">{accounts.length} Registered</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Steam Linked</span>
            <div className="text-sm font-bold text-[#66c0f4] mt-0.5">
              {accounts.filter(a => !!a.steamId).length} Users
            </div>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Memory Footprint</span>
            <div className="text-sm font-bold text-mint mt-0.5">{stats?.memoryUsageMb || 64} MB</div>
          </div>
          <div className="p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Proxy Engine</span>
            <div className="text-sm font-bold text-purple-400 mt-0.5">Ready (CDN Stream)</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-edge bg-surface/20 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sync'
                ? 'border-amber-400 text-flame font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Repository & Sync Control
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'accounts'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Accounts & Steam ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'games'
                ? 'border-cyan-400 text-ice font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Game Catalog ({games.length})
          </button>
          <button
            onClick={() => setActiveTab('saves')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'saves'
                ? 'border-emerald-400 text-mint font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Global Saves ({allSaves.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-zinc-300">
          {/* TAB 1: REPOSITORY & SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-ice" />
                      Repository Integrations
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-mint border border-emerald-500/20">
                      ONLINE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-400">
                    <div className="flex justify-between border-b border-edge/60 pb-1.5">
                      <span>genizy/web-port ({GENIZY_WEBPORT_GAMES.length} Unity/Godot ports):</span>
                      <span className="text-zinc-200 font-mono">Stream Proxy Active</span>
                    </div>
                    <div className="flex justify-between border-b border-edge/60 pb-1.5">
                      <span>quasar mirror ({QUASAR_FLASH_GAMES.length} Flash / {QUASAR_HTML5_GAMES.length} HTML5 / {QUASAR_WEBGL_GAMES.length} WebGL):</span>
                      <span className="text-zinc-200 font-mono">CDN Stream</span>
                    </div>
                    <div className="flex justify-between border-b border-edge/60 pb-1.5">
                      <span>Archive.org ({CURATED_FLASH_COLLECTIONS.length} verified + live search):</span>
                      <span className="text-zinc-200 font-mono">Direct .swf</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flash playback:</span>
                      <span className="text-mint font-bold font-mono">Ruffle WASM (no embeds)</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={handleTriggerSync}
                      disabled={isSyncing}
                      className="px-3.5 py-2 rounded-xl btn-flame text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Synchronizing...' : 'Trigger Sync'}
                    </button>
                    <button
                      onClick={handleClearCache}
                      className="px-3.5 py-2 rounded-xl btn-ghost text-xs font-medium transition-all"
                    >
                      Purge Cache
                    </button>
                  </div>
                </div>

                {/* Live Console Logs */}
                <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-edge text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-flame" />
                      Sync & Stream Monitor
                    </span>
                    <span className="text-mint text-[10px]">LISTENING</span>
                  </div>
                  <div className="flex-1 font-mono text-[11px] text-zinc-400 space-y-1 overflow-y-auto max-h-36">
                    {syncLogs.map((log, i) => (
                      <div key={i} className="leading-tight">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNTS & STEAM */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              {/* Add user form */}
              <div className="p-4 rounded-xl bg-surface/60 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-mint" />
                  Add User Account
                </h4>

                {accountActionMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {accountActionMessage}
                  </div>
                )}

                <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Username *"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="field px-3 py-2 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="field px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="SteamID64 (optional)"
                    value={newSteamId}
                    onChange={e => setNewSteamId(e.target.value)}
                    className="field px-3 py-2 text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as any)}
                      className="field px-2.5 py-2 text-xs"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 rounded-lg btn-flame font-bold text-xs transition-all"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>

              {/* Accounts list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Registered Accounts</span>
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-surface/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface/80 border-b border-edge text-zinc-400 font-mono text-[11px]">
                      <tr>
                        <th className="p-3">Player</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Steam Account</th>
                        <th className="p-3">Cloud Saves</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {accounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-surface/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={acc.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                                alt={acc.username}
                                className="w-7 h-7 rounded-full bg-zinc-800 object-cover"
                              />
                              <div>
                                <span className="font-bold text-white block">{acc.username}</span>
                                <span className="text-[10px] text-zinc-500">{acc.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleRole(acc)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.role === 'admin'
                                  ? 'bg-flame/15 text-flame border border-flame/30'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              {acc.role.toUpperCase()}
                            </button>
                          </td>
                          <td className="p-3">
                            {acc.steamId ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={acc.steamAvatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                                  alt="Steam"
                                  className="w-5 h-5 rounded object-cover border border-[#2a475e]"
                                />
                                <span className="text-[#66c0f4] font-medium text-xs">
                                  {acc.steamPersonaName || acc.steamId}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Unlinked</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-zinc-300">{acc.savesCount || 0} saves</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteAccount(acc.id, acc.username)}
                              disabled={acc.id === currentUser?.id}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 transition-all"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GAME CATALOG */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              {/* Add custom game URL */}
              <div className="p-4 rounded-xl bg-surface/60 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-ice" />
                  Add Custom Game Port to Hub
                </h4>

                {addGameSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    {addGameSuccess}
                  </div>
                )}

                <form onSubmit={handleAddCustomGame} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Game Title (e.g. Portal 2D Web)"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="field px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Embed / Play URL (e.g. https://... or /custom/...)"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    className="field px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Thumbnail URL (optional)"
                    value={customThumb}
                    onChange={e => setCustomThumb(e.target.value)}
                    className="field px-3 py-2 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Genres (comma separated)"
                      value={customGenres}
                      onChange={e => setCustomGenres(e.target.value)}
                      className="flex-1 field px-3 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

              {/* Game list with hide/unhide toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Catalog Items</span>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search games..."
                      value={gameSearch}
                      onChange={e => setGameSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 bg-surface/30">
                  {filteredGames.map(game => (
                    <div key={game.id} className="p-3 flex items-center justify-between gap-4 hover:bg-surface/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-9 h-9 rounded-lg object-cover bg-zinc-800 border border-zinc-800"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${game.hidden ? 'text-zinc-500 line-through' : 'text-white'}`}>
                              {game.title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400">
                              {game.source}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-xs block">
                            {game.embedUrl}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleGame(game.id, !!game.hidden)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          game.hidden
                            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            : 'bg-emerald-500/10 text-mint border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {game.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {game.hidden ? 'Hidden' : 'Visible'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GLOBAL SAVES */}
          {activeTab === 'saves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Global Cloud Saves Repository</h4>
                  <p className="text-xs text-zinc-400">Manage all saved game slots stored across player accounts.</p>
                </div>

                <button
                  onClick={handleExportSaves}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-flame text-xs font-bold transition-all shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup Entire Save DB
                </button>
              </div>

              {savesLoading ? (
                <div className="py-12 text-center text-xs text-zinc-500">Loading save data...</div>
              ) : allSaves.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  No saves currently stored on server.
                </div>
              ) : (
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-surface/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface/80 border-b border-edge text-zinc-400 font-mono text-[11px]">
                      <tr>
                        <th className="p-3">Game</th>
                        <th className="p-3">User ID</th>
                        <th className="p-3">Slot</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {allSaves.map(save => (
                        <tr key={save.id} className="hover:bg-surface/50 transition-colors">
                          <td className="p-3 font-bold text-white">{save.gameTitle}</td>
                          <td className="p-3 font-mono text-zinc-400">{save.userId}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                              {save.slotName}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-500 font-mono text-[11px]">
                            {new Date(save.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={async () => {
                                if (confirm('Delete this save?')) {
                                  const res = await fetch(`/api/saves/${save.id}`, {
                                    method: 'DELETE',
                                    headers: authHeaders()
                                  });
                                  if (res.ok) {
                                    setAllSaves(prev => prev.filter(s => s.id !== save.id));
                                  } else {
                                    const d = await res.json().catch(() => ({}));
                                    alert(d.error || 'Failed to delete save');
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
