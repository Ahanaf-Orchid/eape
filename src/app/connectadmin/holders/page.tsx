'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface User {
  id: string;
  username?: string;
  wallet?: string;
  sol_wallet?: string;
  telegram?: string;
  status?: string;
  referrals?: number;
  invitee?: string;
  mxp?: number;
  gxp?: number;
  reviewStatus?: string;
  timestamp?: string;
  [key: string]: any;
}

type FilterPreset = 'all' | 'hasMxp' | 'verified' | 'hasWallet';
type SortOption = 'mxp_desc' | 'newest' | 'referrals_desc' | 'username';

export default function HoldersPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, token } = useAdminAuth();
  const apiClient = token ? adminApi(token) : null;
  const [isClient, setIsClient] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('all');
  const [sortBy, setSortBy] = useState<SortOption>('mxp_desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustment, setAdjustment] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isLoggedIn && isClient) loadUsers();
  }, [isLoggedIn, isClient]);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterPreset, sortBy]);

  const loadUsers = async () => {
    if (!apiClient) return;
    try {
      const res = await apiClient.getUsers(1, 1000);
      const data = res?.users;
      
      if (data !== null) {
        const userList: User[] = Object.entries(data).map(([key, value]) => ({
          ...(value as User),
          id: key,
        }));
        setUsers(userList);
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Filter by preset
    if (filterPreset === 'hasMxp') {
      filtered = filtered.filter(u => (u.mxp || u.gxp || 0) > 0);
    } else if (filterPreset === 'verified') {
      filtered = filtered.filter(u => {
        const status = (u.reviewStatus || '').toUpperCase();
        return status === 'VERIFIED' || status === 'APPROVED';
      });
    } else if (filterPreset === 'hasWallet') {
      filtered = filtered.filter(u => u.wallet || u.sol_wallet);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(term) ||
        u.wallet?.toLowerCase().includes(term) ||
        u.sol_wallet?.toLowerCase().includes(term) ||
        u.telegram?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'mxp_desc') {
        return (b.mxp || b.gxp || 0) - (a.mxp || a.gxp || 0);
      }
      if (sortBy === 'referrals_desc') {
        return (b.referrals || 0) - (a.referrals || 0);
      }
      if (sortBy === 'newest') {
        return (b.timestamp || '').localeCompare(a.timestamp || '');
      }
      // username
      return (a.username || '').localeCompare(b.username || '');
    });

    setFilteredUsers(filtered);
  };

  const applyMxpAdjustment = async () => {
    if (!selectedUser || !adjustment || !apiClient) return;
    
    const adjustmentNum = parseInt(adjustment, 10);
    if (isNaN(adjustmentNum)) {
      setSaveMessage('Invalid adjustment value');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const currentMxp = selectedUser.mxp || selectedUser.gxp || 0;
      const newMxp = Math.max(0, currentMxp + adjustmentNum);
      
      await apiClient.updateUser(selectedUser.id, {
        mxp: newMxp,
        ...(adjustmentNote ? { adminNote: `[${new Date().toISOString()}] MXP adjusted by ${adjustmentNum}. Note: ${adjustmentNote}` } : {})
      });

      setSaveMessage(`MXP updated: ${currentMxp} → ${newMxp}`);
      
      // Reload users to reflect change
      await loadUsers();
      
      // Update selected user with new value
      setSelectedUser({ ...selectedUser, mxp: newMxp });
      setAdjustment('');
      setAdjustmentNote('');
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('MXP adjustment error:', error);
      setSaveMessage('Failed to update MXP');
    }
    
    setSaving(false);
  };

  if (!isClient || isLoading) return null;

  if (!isLoggedIn) {
    router.push('/connectadmin');
    return null;
  }

  return (
    <>
      <div className="container admin-container">
        <div className="admin-header">
          <h2>HOLDERS</h2>
          <button className="logout-btn" onClick={() => router.push('/connectadmin')}>← BACK</button>
        </div>

        <div className="controls-row">
          <input
            type="text"
            placeholder="Search username, wallet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="controls-row">
          <select
            value={filterPreset}
            onChange={(e) => setFilterPreset(e.target.value as FilterPreset)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="hasMxp">MXP &gt; 0</option>
            <option value="verified">Verified</option>
            <option value="hasWallet">Has Wallet</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="filter-select"
          >
            <option value="mxp_desc">Highest MXP</option>
            <option value="referrals_desc">Most Referrals</option>
            <option value="newest">Newest</option>
            <option value="username">Username A-Z</option>
          </select>
        </div>

        <div className="stats-bar">
          <span>Showing {filteredUsers.length} of {users.length} users</span>
        </div>

        <div className="user-list">
          {loading ? (
            <div className="loading-state">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">No users found</div>
          ) : (
            filteredUsers.slice(0, 50).map(user => (
              <div
                key={user.id}
                className={`user-row ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => { setSelectedUser(user); setAdjustment(''); setAdjustmentNote(''); setSaveMessage(''); }}
              >
                <div className="user-main">
                  <span className="user-username">@{user.username || '—'}</span>
                  <span className="user-mxp">{(user.mxp || user.gxp || 0).toLocaleString()} MXP</span>
                </div>
                <div className="user-details">
                  <span className="user-wallet">{user.wallet ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}` : '—'}</span>
                  <span className="user-refs">{user.referrals || 0} refs</span>
                </div>
              </div>
            ))
          )}
          {filteredUsers.length > 50 && (
            <div className="more-indicator">+{filteredUsers.length - 50} more (use filters)</div>
          )}
        </div>

        {selectedUser && (
          <div className="detail-panel">
            <div className="detail-header">
              <h3>@{selectedUser.username || 'Unknown'}</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            
            <div className="detail-info">
              <div className="detail-row">
                <span className="detail-label">MXP</span>
                <span className="detail-value highlight">{selectedUser.mxp || selectedUser.gxp || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Referrals</span>
                <span className="detail-value">{selectedUser.referrals || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">{selectedUser.reviewStatus || 'pending'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">ETH Wallet</span>
                <span className="detail-value mono">{selectedUser.wallet || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">SOL Wallet</span>
                <span className="detail-value mono">{selectedUser.sol_wallet || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Telegram</span>
                <span className="detail-value">{selectedUser.telegram || '—'}</span>
              </div>
            </div>

            <div className="adjustment-section">
              <h4>Adjust MXP</h4>
              <div className="adjustment-inputs">
                <input
                  type="number"
                  placeholder="+ or - points"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  className="adjustment-input"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="note-input"
                />
              </div>
              <button
                className="adjust-btn"
                onClick={applyMxpAdjustment}
                disabled={saving || !adjustment}
              >
                {saving ? 'SAVING...' : 'APPLY ADJUSTMENT'}
              </button>
              {saveMessage && (
                <p className={`save-msg ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{globals}</style>
    </>
  );
}

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #EED5C1; color: #1E1E1E;
    display: flex; justify-content: center; align-items: flex-start;
    min-height: 100vh; font-family: 'Comic Neue', cursive;
    overflow-y: auto; padding: 20px;
  }
  .container { width: 100%; max-width: 480px; padding: 20px; border: 3px solid #1E1E1E; background: #FAFAFA; text-align: center; position: relative; z-index: 2; box-shadow: 4px 4px 0 #8B5A2B; margin: 20px auto; border-radius: 15px; }
  .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .admin-header h2 { margin: 0; font-family: 'Anton', sans-serif; font-size: 20px; color: #9E1B1E; text-transform: uppercase; letter-spacing: 1px; }
  .logout-btn { background: #FAFAFA; border: 3px solid #1E1E1E; color: #1E1E1E; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 8px; box-shadow: 2px 2px 0 #8B5A2B; }
  .logout-btn:hover { background: #9E1B1E; color: #FAFAFA; }
  
  .controls-row { display: flex; gap: 10px; margin-bottom: 12px; }
  .search-input, .filter-select { width: 100%; padding: 10px 12px; background: #FAFAFA; border: 3px solid #1E1E1E; color: #1E1E1E; font-family: 'Comic Neue', cursive; font-weight: 700; font-size: 13px; border-radius: 8px; }
  .search-input:focus, .filter-select:focus { outline: none; border-color: #F28C28; }
  
  .stats-bar { background: #EED5C1; border: 2px solid #1E1E1E; border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 12px; font-weight: 700; text-align: left; }
  
  .user-list { max-height: 280px; overflow-y: auto; margin-bottom: 12px; }
  .user-row { background: #FAFAFA; border: 2px solid #1E1E1E; border-radius: 10px; padding: 12px; margin-bottom: 8px; cursor: pointer; text-align: left; transition: all 0.15s; }
  .user-row:hover { transform: translateY(-1px); box-shadow: 2px 2px 0 #8B5A2B; }
  .user-row.selected { border-color: #9E1B1E; background: #FFF5F5; }
  .user-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .user-username { font-family: 'Anton', sans-serif; font-size: 14px; color: #1E1E1E; }
  .user-mxp { font-weight: 800; font-size: 14px; color: #9E1B1E; }
  .user-details { display: flex; justify-content: space-between; font-size: 11px; color: #705B4E; }
  .user-wallet, .user-refs { font-family: monospace; }
  
  .loading-state, .empty-state { padding: 30px; color: #705B4E; font-size: 13px; }
  .more-indicator { padding: 10px; font-size: 11px; color: #705B4E; text-align: center; font-style: italic; }
  
  .detail-panel { background: #EED5C1; border: 3px solid #1E1E1E; border-radius: 12px; padding: 16px; text-align: left; }
  .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #1E1E1E; }
  .detail-header h3 { margin: 0; font-family: 'Anton', sans-serif; font-size: 16px; color: #9E1B1E; }
  .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #1E1E1E; line-height: 1; padding: 0; }
  
  .detail-info { margin-bottom: 16px; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1E1E1E; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { font-size: 11px; color: #705B4E; text-transform: uppercase; font-weight: 700; }
  .detail-value { font-size: 13px; font-weight: 700; color: #1E1E1E; }
  .detail-value.highlight { color: #9E1B1E; font-size: 16px; }
  .detail-value.mono { font-family: monospace; font-size: 11px; }
  
  .adjustment-section { background: #FAFAFA; border: 2px solid #1E1E1E; border-radius: 10px; padding: 14px; }
  .adjustment-section h4 { margin: 0 0 12px 0; font-family: 'Anton', sans-serif; font-size: 13px; color: #1E1E1E; text-transform: uppercase; }
  .adjustment-inputs { display: flex; gap: 8px; margin-bottom: 10px; }
  .adjustment-input { flex: 1; padding: 10px; background: #FAFAFA; border: 2px solid #1E1E1E; border-radius: 8px; font-family: 'Comic Neue', cursive; font-weight: 700; font-size: 13px; }
  .note-input { flex: 2; padding: 10px; background: #FAFAFA; border: 2px solid #1E1E1E; border-radius: 8px; font-family: 'Comic Neue', cursive; font-size: 12px; }
  .adjustment-input:focus, .note-input:focus { outline: none; border-color: #F28C28; }
  
  .adjust-btn { width: 100%; padding: 12px; background: #9E1B1E; color: #FAFAFA; border: 2px solid #1E1E1E; border-radius: 8px; font-family: 'Comic Neue', cursive; font-weight: 700; font-size: 13px; cursor: pointer; text-transform: uppercase; }
  .adjust-btn:hover:not(:disabled) { background: #7a1518; }
  .adjust-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .save-msg { margin: 10px 0 0 0; font-size: 12px; font-weight: 700; text-align: center; }
  .save-msg.success { color: #2e7d32; }
  .save-msg.error { color: #C62828; }
`;
