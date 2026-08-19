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
  Activity,
  Terminal,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEscapeKey } from '../lib/hooks';
import { GENIZY_WEBPORT_GAMES } from '../data/webportGames';
import { QUASAR_FLASH_GAMES, QUASAR_HTML5_GAMES, QUASAR_WEBGL_GAMES, QUASAR_EMULATOR_GAMES } from '../data/quasarGames';
import { CURATED_FLASH_COLLECTIONS } from '../data/flashArchives';

interface AdminPanelProps {
  games: Game[];
  onClose: () => void;
  onRefreshGames: () => void;
  currentUser: UserAccount | null;
}

export function AdminPanel({ games, onClose, onRefreshGames, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'accounts' | 'games' | 'saves'>('sync');

  // Every /api/admin route requires an admin session, carried by the httpOnly cookie
  const isAdmin = currentUser?.role === 'admin';
  const authHeaders = (extra?: Record<string, string>): Record<string, string> => ({ ...(extra || {}) });

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

  // Catalogue health
  interface HealthFailure { id: string; title: string; target: string; kind: string; status: number | string }
  interface HealthReport { startedAt: string; finishedAt: string | null; checked: number; total: number; failures: HealthFailure[] }
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [healthRunning, setHealthRunning] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    '[System] Admin Console initialized.',
    `[System] genizy/web-port proxy active (${GENIZY_WEBPORT_GAMES.length} ports available).`,
    `[System] quasar mirror: ${QUASAR_FLASH_GAMES.length + QUASAR_HTML5_GAMES.length + QUASAR_WEBGL_GAMES.length + QUASAR_EMULATOR_GAMES.length} titles streaming from CDN.`
  ]);

  const appendLog = (message: string) =>
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);

  useEscapeKey(onClose);

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

  // --- Catalogue health check ---
  const loadHealth = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/health-check', { headers: authHeaders() });
      if (!res.ok) return;
      const d = await res.json();
      setHealth(d.report || null);
      setHealthRunning(!!d.running);
    } catch {
      /* the panel simply shows the previous report */
    }
  };

  useEffect(() => {
    loadHealth();
  }, [isAdmin]);

  // Poll while a scan is in flight so the progress count advances
  useEffect(() => {
    if (!healthRunning) return;
    const timer = setInterval(loadHealth, 2000);
    return () => clearInterval(timer);
  }, [healthRunning]);

  const handleRunHealthCheck = async () => {
    setHealthRunning(true);
    appendLog('Starting catalogue health check…');
    try {
      const res = await fetch('/api/admin/health-check', { method: 'POST', headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) {
        appendLog(`Health check refused: ${d.error || res.status}`);
        setHealthRunning(false);
        return;
      }
      appendLog(`Probing ${d.total ?? '?'} catalogue entries…`);
      loadHealth();
    } catch (err: any) {
      appendLog(`Health check failed: ${err.message}`);
      setHealthRunning(false);
    }
  };

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
  // The old fixed seed was itself on the server's common-password blocklist, so every
  // provisioned account was rejected before it was created. Seed a fresh random one.
  const generatePassword = () =>
    'fh-' + Array.from(crypto.getRandomValues(new Uint8Array(9)), b => b.toString(36)).join('').slice(0, 12);
  const [newPassword, setNewPassword] = useState(generatePassword);
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
          password: newPassword || generatePassword(),
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
              headers: { 'Content-Type': 'application/json', 'X-Auth-Token': d.token },
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
      const usedPassword = newPassword;
      setNewUsername('');
      setNewEmail('');
      setNewSteamId('');
      setNewPassword(generatePassword());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="sheet w-full max-w-5xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rule bg-shade/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink tracking-tight">Admin & Sync Operations Center</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-xs text-ink/60">
                Manage live game ports, user profiles, Steam synchronization, and server status.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 btn-ghost hover:text-ink flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin session notice */}
        {!isAdmin && (
          <div className="px-5 py-3 bg-accent/10 border-b border-accent/25 text-accent text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Signed-in admin session required. Sign in from the account menu with an admin account to
              load server stats and run operations here.
            </span>
          </div>
        )}

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-rule bg-shade/30 divide-x divide-hair text-xs">
          <div className="p-3">
            <span className="text-[10px] font-mono text-ink/60 uppercase tracking-wider block">Total Games</span>
            <div className="text-sm font-bold text-ink mt-0.5">{games.length} Active</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-ink/60 uppercase tracking-wider block">Player Accounts</span>
            <div className="text-sm font-bold text-ink mt-0.5">{accounts.length} Registered</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-ink/60 uppercase tracking-wider block">Steam Linked</span>
            <div className="text-sm font-bold text-[#66c0f4] mt-0.5">
              {accounts.filter(a => !!a.steamId).length} Users
            </div>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-ink/60 uppercase tracking-wider block">Memory Footprint</span>
            <div className="text-sm font-bold text-accent mt-0.5">{stats?.memoryUsageMb || 64} MB</div>
          </div>
          <div className="p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-ink/60 uppercase tracking-wider block">Proxy Engine</span>
            <div className="text-sm font-bold text-accent mt-0.5">Ready (CDN Stream)</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-rule bg-shade/20 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sync'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Repository & Sync Control
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'accounts'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Accounts & Steam ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'games'
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Game Catalog ({games.length})
          </button>
          <button
            onClick={() => setActiveTab('saves')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'saves'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Global Saves ({allSaves.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-ink/80">
          {/* TAB 1: REPOSITORY & SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-shade/60 border border-rule space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                      <Server className="w-4 h-4 text-ink" />
                      Repository Integrations
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] bg-accent/10 text-accent border border-accent/25">
                      ONLINE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-ink/60">
                    <div className="flex justify-between border-b border-rule/60 pb-1.5">
                      <span>genizy/web-port ({GENIZY_WEBPORT_GAMES.length} Unity/Godot ports):</span>
                      <span className="text-ink font-mono">Stream Proxy Active</span>
                    </div>
                    <div className="flex justify-between border-b border-rule/60 pb-1.5">
                      <span>quasar mirror ({QUASAR_FLASH_GAMES.length} Flash / {QUASAR_HTML5_GAMES.length} HTML5 / {QUASAR_WEBGL_GAMES.length} WebGL / {QUASAR_EMULATOR_GAMES.length} Emu):</span>
                      <span className="text-ink font-mono">CDN Stream</span>
                    </div>
                    <div className="flex justify-between border-b border-rule/60 pb-1.5">
                      <span>Archive.org ({CURATED_FLASH_COLLECTIONS.length} verified + live search):</span>
                      <span className="text-ink font-mono">Direct .swf</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flash playback:</span>
                      <span className="text-accent font-bold font-mono">Ruffle WASM (no embeds)</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={handleTriggerSync}
                      disabled={isSyncing}
                      className="px-3.5 py-2 btn-primary text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Synchronizing...' : 'Trigger Sync'}
                    </button>
                    <button
                      onClick={handleClearCache}
                      className="px-3.5 py-2 btn-ghost text-xs font-medium transition-all"
                    >
                      Purge Cache
                    </button>
                  </div>
                </div>

                {/* Live Console Logs */}
                {/* The monitor stays on ink: it is a readout, not a surface you compose on. */}
                <div className="p-4 bg-ink border-2 border-ink flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-hair-lit text-[11px] font-mono text-paper/60">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-accent-lit" />
                      Sync &amp; Stream Monitor
                    </span>
                    <span className="text-accent-lit text-[10px]">LISTENING</span>
                  </div>
                  <div className="flex-1 font-mono text-[11px] text-paper/70 space-y-1 overflow-y-auto max-h-36">
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
              <div className="p-4 bg-shade/60 border border-rule space-y-3">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-accent" />
                  Add User Account
                </h4>

                {accountActionMessage && (
                  <div className="p-2.5 bg-accent/10 border border-accent/25 text-accent text-xs flex items-center gap-2">
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
                      className="flex-1 px-3 py-2 btn-primary font-bold text-xs transition-all"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>

              {/* Accounts list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink/60 uppercase tracking-wider block">Registered Accounts</span>
                <div className="border border-rule overflow-hidden bg-shade/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-shade/80 border-b border-rule text-ink/60 font-mono text-[11px]">
                      <tr>
                        <th className="p-3">Player</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Steam Account</th>
                        <th className="p-3">Cloud Saves</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hair">
                      {accounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-shade/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={acc.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                                alt={acc.username}
                                className="w-7 h-7 bg-shade object-cover"
                              />
                              <div>
                                <span className="font-bold text-ink block">{acc.username}</span>
                                <span className="text-[10px] text-ink/55">{acc.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleRole(acc)}
                              className={`px-2 py-0.5  text-[10px] font-bold ${
                                acc.role === 'admin'
                                  ? 'bg-accent/15 text-accent border border-accent/30'
                                  : 'bg-shade text-ink/80 border border-rule'
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
                                  className="w-5 h-5 object-cover border border-[#2a475e]"
                                />
                                <span className="text-[#66c0f4] font-medium text-xs">
                                  {acc.steamPersonaName || acc.steamId}
                                </span>
                              </div>
                            ) : (
                              <span className="text-ink/55 text-[11px]">Unlinked</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-ink/80">{acc.savesCount || 0} saves</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteAccount(acc.id, acc.username)}
                              disabled={acc.id === currentUser?.id}
                              className="p-1.5 bg-accent/10 hover:bg-accent/20 text-accent disabled:opacity-30 transition-all"
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
              <div className="p-4 bg-shade/60 border border-rule space-y-3">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-ink" />
                  Add Custom Game Port to Hub
                </h4>

                {addGameSuccess && (
                  <div className="p-2.5 bg-accent/10 border border-accent/25 text-accent text-xs">
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
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

              {/* Catalogue health */}
              <div className="panel p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-accent" />
                      Catalogue Health
                    </h4>
                    <p className="text-[11px] text-ink/55 mt-1">
                      Probes every game and thumbnail the way a player reaches it, so dead mirrors
                      show up here instead of in someone's game window.
                    </p>
                  </div>
                  <button
                    onClick={handleRunHealthCheck}
                    disabled={healthRunning}
                    className="btn-ghost flex-shrink-0 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                  >
                    {healthRunning ? 'Scanning…' : 'Run scan'}
                  </button>
                </div>

                {healthRunning && health && (
                  <div className="space-y-1.5">
                    <div className="h-1 bg-ink/5 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-[width] duration-500"
                        style={{ width: `${health.total ? Math.round((health.checked / health.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-ink/55">
                      {health.checked} / {health.total} targets
                    </span>
                  </div>
                )}

                {!healthRunning && health && (
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className={health.failures.length === 0 ? 'text-accent font-semibold' : 'text-accent font-semibold'}>
                      {health.failures.length === 0
                        ? 'All targets responded'
                        : `${health.failures.length} dead target${health.failures.length === 1 ? '' : 's'}`}
                    </span>
                    <span className="text-ink/45 font-mono">
                      {health.checked} checked · {health.finishedAt ? new Date(health.finishedAt).toLocaleString() : 'incomplete'}
                    </span>
                  </div>
                )}

                {!healthRunning && health && health.failures.length > 0 && (
                  <div className="max-h-44 overflow-y-auto border border-rule divide-y divide-rule/70">
                    {health.failures.map((f, i) => (
                      <div key={`${f.id}-${f.kind}-${i}`} className="p-2 flex items-center justify-between gap-3 text-[11px]">
                        <div className="min-w-0">
                          <span className="font-semibold text-ink">{f.title}</span>
                          <span className="ml-2 font-mono text-[10px] text-ink/45">{f.kind}</span>
                          <span className="block font-mono text-[10px] text-ink/45 truncate">{f.target}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="chip chip-custom">{f.status}</span>
                          <button
                            onClick={() => handleToggleGame(f.id, false)}
                            className="btn-ghost px-2 py-1 text-[10px]"
                            title="Hide this game from the catalogue"
                          >
                            Hide
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!health && !healthRunning && (
                  <p className="text-[11px] text-ink/45">No scan has been run yet.</p>
                )}
              </div>

              {/* Game list with hide/unhide toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Catalog Items</span>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink/55" />
                    <input
                      type="text"
                      placeholder="Search games..."
                      value={gameSearch}
                      onChange={e => setGameSearch(e.target.value)}
                      className="field w-full pl-8 pr-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-rule divide-y divide-hair bg-shade/30">
                  {filteredGames.map(game => (
                    <div key={game.id} className="p-3 flex items-center justify-between gap-4 hover:bg-shade/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-9 h-9 object-cover bg-shade border border-rule"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${game.hidden ? 'text-ink/55 line-through' : 'text-ink'}`}>
                              {game.title}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-shade text-ink/60">
                              {game.source}
                            </span>
                          </div>
                          <span className="text-[10px] text-ink/55 font-mono truncate max-w-xs block">
                            {game.embedUrl}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleGame(game.id, !!game.hidden)}
                        className={`flex items-center gap-1.5 px-3 py-1.5  text-xs font-medium transition-all ${
                          game.hidden
                            ? 'bg-shade text-ink/60 hover:bg-neutral-300 hover:text-ink'
                            : 'bg-accent/10 text-accent border border-accent/25 hover:bg-accent/20'
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
                  <h4 className="text-sm font-bold text-ink">Global Cloud Saves Repository</h4>
                  <p className="text-xs text-ink/60">Manage all saved game slots stored across player accounts.</p>
                </div>

                <button
                  onClick={handleExportSaves}
                  className="flex items-center gap-1.5 px-3.5 py-2 btn-primary text-xs font-bold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup Entire Save DB
                </button>
              </div>

              {savesLoading ? (
                <div className="py-12 text-center text-xs text-ink/55">Loading save data...</div>
              ) : allSaves.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-rule text-xs text-ink/55">
                  No saves currently stored on server.
                </div>
              ) : (
                <div className="border border-rule overflow-hidden bg-shade/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-shade/80 border-b border-rule text-ink/60 font-mono text-[11px]">
                      <tr>
                        <th className="p-3">Game</th>
                        <th className="p-3">User ID</th>
                        <th className="p-3">Slot</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hair">
                      {allSaves.map(save => (
                        <tr key={save.id} className="hover:bg-shade/50 transition-colors">
                          <td className="p-3 font-bold text-ink">{save.gameTitle}</td>
                          <td className="p-3 font-mono text-ink/60">{save.userId}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] bg-shade text-ink/80 font-mono">
                              {save.slotName}
                            </span>
                          </td>
                          <td className="p-3 text-ink/55 font-mono text-[11px]">
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
                              className="p-1.5 bg-accent/10 hover:bg-accent/20 text-accent transition-all"
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
