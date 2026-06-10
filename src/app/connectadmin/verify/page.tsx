'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface User {
  id: string;
  username: string;
  wallet?: string;
  sol_wallet?: string;
  telegram?: string;
  status?: string;
  referrals?: number;
  invitee?: string;
  gxp?: number;
  mxp?: number;
  reviewStatus?: string;
  reviewNotes?: string;
  disqualifyReason?: string;
  timestamp?: string;
  [key: string]: any;
}

interface InviterData {
  username: string;
  totalInvites: number;
  verified: number;
  pending: number;
  disqualified: number;
  needsImprovement: number;
}

interface CheckOption {
  id: string;
  label: string;
  shortLabel: string;
}

const CHECK_OPTIONS: CheckOption[] = [
  { id: 'x', label: 'X (Twitter)', shortLabel: 'X' },
  { id: 'telegram', label: 'Telegram', shortLabel: 'TG' },
  { id: 'wallet', label: 'Wallet (ETH)', shortLabel: 'WAL' },
  { id: 'sol', label: 'SOL Wallet', shortLabel: 'SOL' },
  { id: 'comment_1', label: 'Proof Link 1', shortLabel: 'P1' },
  { id: 'comment_2', label: 'Proof Link 2', shortLabel: 'P2' },
  { id: 'comment_3', label: 'Proof Link 3', shortLabel: 'P3' },
];

const DISQUALIFY_REASONS = [
  { value: 'FAKE', label: 'Fake / Bot' },
  { value: 'DUPLICATE', label: 'Duplicate Entry' },
  { value: 'OTHER', label: 'Other' },
];

export default function VerifyPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, login, logout, token } = useAdminAuth();
  const apiClient = token ? adminApi(token) : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [queueMode, setQueueMode] = useState<'all' | 'inviter' | 'campaign'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [selectedInviter, setSelectedInviter] = useState<string | null>(null);
  const [expandedInviter, setExpandedInviter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedChecks, setSelectedChecks] = useState<string[]>(['x', 'telegram', 'comment_1', 'comment_2']);
  const [showCheckSelector, setShowCheckSelector] = useState(false);
  const [inviters, setInviters] = useState<InviterData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [disqualifyTarget, setDisqualifyTarget] = useState<{ids: string[]; reason: string; note: string; fromInviter?: string} | null>(null);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => { if (isLoggedIn && isClient) loadUsers(); }, [isLoggedIn, isClient]);
  useEffect(() => { filterAndSortUsers(); }, [users, searchTerm, statusFilter, reviewFilter, sortBy, queueMode, selectedInviter]);

  const loadUsers = async () => {
    if (!apiClient) return;
    setLoadError(null);
    try {
      const res = await apiClient.getUsers(1, 1000);
      const data = res?.users;
      if (data !== null) {
        const userList: User[] = Object.entries(data || {}).map(([key, value]) => ({ ...(value as User), id: key }));
        setUsers(userList);
        processInviters(userList);
      }
    } catch (error: any) {
      console.error('Load users error:', error);
      const msg = error?.message || 'Failed to load users';
      if (msg.includes('permission_denied') || msg.includes('Permission denied')) {
        setLoadError('Firebase permission denied. Check database rules or ensure authenticated.');
      } else {
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const processInviters = (userList: User[]) => {
    const inviterMap: Record<string, InviterData> = {};
    userList.forEach(user => {
      const normalizedInviter = normalizeInviter(user.invitee);
      if (normalizedInviter) {
        if (!inviterMap[normalizedInviter]) {
          inviterMap[normalizedInviter] = { username: displayInviter(user.invitee).replace('@', ''), totalInvites: 0, verified: 0, pending: 0, disqualified: 0, needsImprovement: 0 };
        }
        inviterMap[normalizedInviter].totalInvites++;
        const status = mapReviewStatus(user.reviewStatus);
        if (status === 'verified') inviterMap[normalizedInviter].verified++;
        else if (status === 'disqualified') inviterMap[normalizedInviter].disqualified++;
        else if (status === 'needs_improvement') inviterMap[normalizedInviter].needsImprovement++;
        else inviterMap[normalizedInviter].pending++;
      }
    });
    setInviters(Object.values(inviterMap).sort((a, b) => b.totalInvites - a.totalInvites));
  };

  const mapReviewStatus = (status?: string, vStatus?: string): string => {
    const s = (status || vStatus || "pending").toLowerCase();
    if (s === 'approved' || s === 'verified') return 'verified';
    if (s === 'rejected' || s === 'disqualified') return 'disqualified';
    if (s === 'needs_improvement') return 'needs_improvement';
    return 'pending';
  };

  const normalizeInviter = (inviter?: string): string => {
    if (!inviter || inviter === 'none' || inviter.trim() === '') return '';
    return inviter.replace('@', '').trim().toLowerCase();
  };

  const displayInviter = (inviter?: string): string => {
    if (!inviter || inviter === 'none' || inviter.trim() === '') return '';
    return `@${inviter.replace('@', '').trim()}`;
  };

  const normalizeTimestamp = (ts: unknown): string => {
    if (!ts) return '';
    if (typeof ts === 'string') return ts;
    if (typeof ts === 'number') return String(ts);
    if (typeof ts === 'object' && ts !== null) {
      const t = ts as { seconds?: number; toString?: () => string };
      if (t.seconds) return String(t.seconds);
      if (t.toString) return t.toString();
    }
    return String(ts);
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => u.username?.toLowerCase().includes(term) || u.wallet?.toLowerCase().includes(term) || u.sol_wallet?.toLowerCase().includes(term) || u.telegram?.toLowerCase().includes(term));
    }
    if (statusFilter !== 'all') filtered = filtered.filter(u => u.status === statusFilter);
    if (reviewFilter !== 'all') filtered = filtered.filter(u => mapReviewStatus(u.reviewStatus) === reviewFilter);
    if (queueMode === 'inviter' && selectedInviter) {
      filtered = filtered.filter(u => normalizeInviter(u.invitee) === normalizeInviter(selectedInviter));
    } else if (queueMode === 'campaign') {
      filtered = filtered.filter(u => u.campaignCompletedTasks && u.campaignCompletedTasks.length > 0);
    }
    switch (sortBy) {
      case 'newest': filtered.sort((a, b) => normalizeTimestamp(b.timestamp).localeCompare(normalizeTimestamp(a.timestamp))); break;
      case 'mxp': filtered.sort((a, b) => (b.mxp || b.gxp || 0) - (a.mxp || a.gxp || 0)); break;
      case 'referrals': filtered.sort((a, b) => (b.referrals || 0) - (a.referrals || 0)); break;
    }
    setFilteredUsers(filtered);
  };

  const toggleCheck = (checkId: string) => {
    if (selectedChecks.includes(checkId)) {
      if (selectedChecks.length > 1) setSelectedChecks(selectedChecks.filter(c => c !== checkId));
    } else {
      if (selectedChecks.length < 7) setSelectedChecks([...selectedChecks, checkId]);
    }
  };

  const getCheckStatus = (user: User, checkId: string): { present: boolean; link: string } => {
    switch (checkId) {
      case 'x': return { present: !!user.username, link: user.username ? `https://x.com/${user.username.replace('@', '')}` : '' };
      case 'telegram': return { present: !!user.telegram, link: user.telegram ? `https://t.me/${user.telegram.replace('@', '')}` : '' };
      case 'wallet': return { present: !!user.wallet, link: user.wallet ? `https://etherscan.io/address/${user.wallet}` : '' };
      case 'sol': return { present: !!user.sol_wallet, link: user.sol_wallet ? `https://solscan.io/address/${user.sol_wallet}` : '' };
      case 'comment_1': return { present: !!user.comment_1, link: user.comment_1 || '' };
      case 'comment_2': return { present: !!user.comment_2, link: user.comment_2 || '' };
      case 'comment_3': return { present: !!user.comment_3, link: user.comment_3 || '' };
      default: return { present: false, link: '' };
    }
  };

  const getReviewCounts = () => ({
    pending: users.filter(u => mapReviewStatus(u.reviewStatus) === 'pending').length,
    verified: users.filter(u => mapReviewStatus(u.reviewStatus) === 'verified').length,
    needsImprovement: users.filter(u => mapReviewStatus(u.reviewStatus) === 'needs_improvement').length,
    disqualified: users.filter(u => mapReviewStatus(u.reviewStatus) === 'disqualified').length,
  });

  const handleLogin = async () => { if (!(await login(email, password))) setLoginError('Invalid email or password'); };
  const handleLogout = () => logout();

  const mapToUppercase = (status: string): string => {
    if (status === 'verified' || status === 'approved') return 'VERIFIED';
    if (status === 'disqualified' || status === 'rejected') return 'DISQUALIFIED';
    if (status === 'needs_improvement') return 'NEEDS_IMPROVEMENT';
    if (status === 'pending') return 'PENDING';
    return status;
  };

  const updateUserReviewStatus = async (userId: string, newStatus: string, notes?: string, reason?: string) => {
    if (!apiClient) return;
    const uppercaseStatus = mapToUppercase(newStatus);
    setSaving(true);
    try {
      await apiClient.updateUser(userId, { reviewStatus: uppercaseStatus, reviewedAt: new Date().toISOString(), ...(notes !== undefined && { reviewNotes: notes || null }), ...(reason !== undefined && { disqualifyReason: reason || null }) });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, reviewStatus: uppercaseStatus, reviewNotes: notes, disqualifyReason: reason } : u));
      setSuccessMessage(`User ${uppercaseStatus === 'VERIFIED' ? 'verified' : uppercaseStatus === 'DISQUALIFIED' ? 'disqualified' : 'updated'}!`);
      setTimeout(() => setSuccessMessage(''), 2000);
      if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, reviewStatus: uppercaseStatus, reviewNotes: notes, disqualifyReason: reason } : null);
    } catch (error) { console.error('Update error:', error); }
    setSaving(false);
  };

  const bulkActionUsers = async (action: 'verify' | 'review' | 'disqualify', userIds: string[]) => {
    if (userIds.length === 0 || !apiClient) return;
    setSaving(true);
    try {
      if (action === 'review') {
        for (const userId of userIds) {
          await apiClient.updateUser(userId, { reviewStatus: 'NEEDS_IMPROVEMENT', reviewedAt: new Date().toISOString() });
        }
      } else {
        await apiClient.verifyUsers(userIds, action === 'verify' ? 'verify' : 'disqualify');
      }
      setUsers(prev => prev.map(u => userIds.includes(u.id) ? { ...u, reviewStatus: status } : u));
      setSuccessMessage(`${userIds.length} users ${action}ed!`);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) { console.error('Bulk action error:', error); }
    setSaving(false);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => { const next = new Set(prev); next.has(userId) ? next.delete(userId) : next.add(userId); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const exportVerifiedUsers = () => {
    const verified = users.filter(u => mapReviewStatus(u.reviewStatus) === 'verified');
    const csv = [['#', 'Username', 'Wallet', 'SOL Wallet', 'Telegram', 'MXP', 'Referrals', 'Invitee', 'Verified At'].join(','), ...verified.map((u, i) => [i + 1, u.username || '', u.wallet || '', u.sol_wallet || '', u.telegram || '', u.mxp || u.gxp || 0, u.referrals || 0, u.invitee || '', u.reviewedAt ? String(u.reviewedAt).split('T')[0] : ''].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `verified_users_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const getStatusBadge = (status?: string) => {
    const mapped = mapReviewStatus(status);
    const colors: Record<string, { bg: string; color: string }> = { pending: { bg: '#fff3cd', color: '#856404' }, verified: { bg: '#d4edda', color: '#155724' }, needs_improvement: { bg: '#cce5ff', color: '#004085' }, disqualified: { bg: '#f8d7da', color: '#721c24' } };
    const style = colors[mapped] || colors.pending;
    return { text: mapped === 'needs_improvement' ? 'Needs Review' : mapped.toUpperCase(), ...style };
  };

  const counts = getReviewCounts();
  if (!isClient || authLoading) return null;
  if (!isLoggedIn) {
    return (
      <div style={pageWrap}>
        <div style={loginCard}>
          <h2 style={{...titleStyle, textAlign: 'center', marginBottom: 24}}>🔍 VERIFY USERS</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          {loginError && <p style={errorStyle}>{loginError}</p>}
          <button onClick={handleLogin} style={{...primaryBtn, width: '100%', padding: 14, fontSize: 14, marginBottom: 10}}>LOGIN</button>
          <button onClick={() => router.push('/connectadmin')} style={{...secondaryBtn, width: '100%', padding: 14, fontSize: 14}}>← BACK TO ADMIN</button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={shell}>
        <div style={header}>
          <h1 style={titleStyle}>🔍 VERIFY USERS</h1>
          <div style={headerButtons}>
            <button onClick={exportVerifiedUsers} style={exportBtn}>📥 CSV</button>
            <button onClick={handleLogout} style={secondaryBtn}>Logout</button>
            <button onClick={() => router.push('/connectadmin')} style={secondaryBtn}>← Back</button>
          </div>
        </div>
        {successMessage && <div style={successBanner}>{successMessage}</div>}
        {loadError && (
          <div style={{...successBanner, background: '#ffebee', color: '#c62828', borderColor: '#c62828'}}>
            ⚠️ {loadError}
          </div>
        )}
        {!loadError && <div style={statsBar}>
          <div style={statItem}><span style={statLabel}>Total</span><span style={statValue}>{users.length}</span></div>
          <div style={statItem}><span style={statLabel}>Pending</span><span style={statValue}>{counts.pending}</span></div>
          <div style={statItem}><span style={{...statValue, color: '#28a745'}}>✓{counts.verified}</span></div>
          <div style={statItem}><span style={{...statValue, color: '#007bff'}}>✎{counts.needsImprovement}</span></div>
          <div style={statItem}><span style={{...statValue, color: '#dc3545'}}>✗{counts.disqualified}</span></div>
        </div>}

        {!loadError && (<div style={filterBar}>
          <input type="text" placeholder="Search username, wallet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{...inputStyle, marginBottom: 8}} />
          <div style={filterRow}>
            <select value={queueMode} onChange={e => { setQueueMode(e.target.value as any); if (e.target.value !== 'inviter') { setSelectedInviter(null); setExpandedInviter(null); } else { const top = inviters[0]; if (top) setExpandedInviter(top.username); }}} style={selectStyle}>
              <option value="all">All Users</option>
              <option value="inviter">By Inviter</option>
              <option value="campaign">Campaign Users</option>
            </select>

            {queueMode === 'inviter' && (
              <div style={{width: '100%', marginTop: 8}}>
                {inviters.map(inv => {
                  const isExpanded = expandedInviter === inv.username;
                  const invUsers = users.filter(u => normalizeInviter(u.invitee) === normalizeInviter(inv.username));
                  const filteredInvUsers = invUsers.filter(u => reviewFilter === 'all' || mapReviewStatus(u.reviewStatus) === reviewFilter).sort((a, b) => {
                    if (sortBy === 'newest') return normalizeTimestamp(b.timestamp).localeCompare(normalizeTimestamp(a.timestamp));
                    if (sortBy === 'mxp') return (b.mxp || b.gxp || 0) - (a.mxp || a.gxp || 0);
                    if (sortBy === 'referrals') return (b.referrals || 0) - (a.referrals || 0);
                    return 0;
                  });
                  return (
                    <div key={inv.username} style={{marginBottom: 8}}>
                      <div onClick={() => setExpandedInviter(isExpanded ? null : inv.username)} style={{cursor: 'pointer', padding: '10px 12px', background: isExpanded ? '#e3f2fd' : '#f5f5f5', border: '2px solid #1E1E1E', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700}}>
                        <div>
                          <span style={{color: '#1E1E1E'}}>@{inv.username}</span>
                          <span style={{marginLeft: 12, fontSize: 12, color: '#666'}}>
                            Total: {inv.totalInvites} | <span style={{color: '#28a745', marginLeft: 6}}>✓{inv.verified}</span>
                            <span style={{color: '#ffc107', marginLeft: 6}}>⏳{inv.pending}</span>
                            {inv.needsImprovement > 0 && <span style={{color: '#007bff', marginLeft: 6}}>✎{inv.needsImprovement}</span>}
                            <span style={{color: '#dc3545', marginLeft: 6}}>✗{inv.disqualified}</span>
                          </span>
                        </div>
                        <span style={{fontSize: 16}}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      {isExpanded && (
                        <div style={{padding: '12px', background: '#fafafa', border: '2px solid #1E1E1E', borderTop: 'none', borderRadius: '0 0 8px 8px'}}>
                          <div style={{marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                            <button onClick={() => bulkActionUsers('verify', filteredInvUsers.map(u => u.id))} style={{...primaryBtn, padding: '8px 12px', fontSize: 12}}>Verify All</button>
                            <button onClick={() => bulkActionUsers('review', filteredInvUsers.map(u => u.id))} style={{...reviewBtn, padding: '8px 12px', fontSize: 12}}>Review All</button>
                            <button onClick={() => { setDisqualifyTarget({ ids: filteredInvUsers.map(u => u.id), reason: '', note: '', fromInviter: inv.username }); setShowDisqualifyModal(true); }} style={{...disqualifyBtn, padding: '8px 12px', fontSize: 12}}>DQ All</button>
                          </div>
                          <div style={{maxHeight: 300, overflowY: 'auto'}}>
                            {filteredInvUsers.slice(0, 30).map(user => {
                              const statusBadge = getStatusBadge(user.reviewStatus);
                              return (
                                <div key={user.id} style={{padding: '8px', background: '#fff', border: '2px solid #eee', borderRadius: 6, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                    <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleSelectUser(user.id)} style={{width: 16, height: 16}} />
                                    <span style={{cursor: 'pointer', color: '#007bff', fontWeight: 700}} onClick={() => setSelectedUser(user)}>@{user.username}</span>
                                    <span style={{...statusBadge, fontSize: 10, padding: '2px 6px'}}>{statusBadge.text}</span>
                                  </div>
                                  <div style={{display: 'flex', gap: 6}}>
                                    <button onClick={() => bulkActionUsers('verify', [user.id])} style={{padding: '4px 8px', fontSize: 10, background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'}}>✓</button>
                                    <button onClick={() => { setDisqualifyTarget({ ids: [user.id], reason: '', note: '' }); setShowDisqualifyModal(true); }} style={{padding: '4px 8px', fontSize: 10, background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'}}>✗</button>
                                  </div>
                                </div>
                              );
                            })}
                            {filteredInvUsers.length > 30 && <div style={{fontSize: 11, color: '#666', textAlign: 'center', padding: 8}}>+{filteredInvUsers.length - 30} more</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {queueMode !== 'inviter' && (
              <div style={{marginBottom: 12}}>
                <button onClick={() => setShowCheckSelector(!showCheckSelector)} style={checksBtn}>Checks ({selectedChecks.length}) ▼</button>
                {showCheckSelector && (
                  <div style={checksMenu}>
                    {CHECK_OPTIONS.map(check => (
                      <label key={check.id} style={checkLabel}>
                        <input type="checkbox" checked={selectedChecks.includes(check.id)} onChange={() => toggleCheck(check.id)} disabled={!selectedChecks.includes(check.id) && selectedChecks.length >= 7} />
                        {check.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>)}

        {selectedUsers.size > 0 && (
          <div style={batchBar}>
            <span>{selectedUsers.size} selected</span>
            <button onClick={() => bulkActionUsers('verify', Array.from(selectedUsers))} style={primaryBtn} disabled={saving}>Verify All</button>
          </div>
        )}

        <div style={userList}>
          {loading ? <div style={emptyState}>Loading...</div> : loadError ? <div style={emptyState}>Unable to load users. Check console for details.</div> : filteredUsers.length === 0 ? <div style={emptyState}>{queueMode === 'campaign' ? 'No campaign users found' : 'No users found'}</div> : filteredUsers.slice(0, 50).map(user => {
            const statusBadge = getStatusBadge(user.reviewStatus);
            return (
              <div key={user.id} style={userCard}>
                <div style={userCardHeader}>
                  <div style={userMainInfo}>
                    <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleSelectUser(user.id)} style={checkbox} />
                    <span style={usernameLink} onClick={() => setSelectedUser(user)}>@{user.username}</span>
                    {user.invitee && <span style={inviteeTag}>by {displayInviter(user.invitee)}</span>}
                  </div>
                  <span style={{...statusBadge, ...reviewBadge}}>{statusBadge.text}</span>
                </div>
                <div style={userCardBody}>
                  <div style={userStat}><span style={userStatLabel}>Referrals</span><span style={userStatValue}>{user.referrals || 0}</span></div>
                  <div style={userStat}><span style={userStatLabel}>MXP</span><span style={userStatValue}>{user.mxp || user.gxp || 0}</span></div>
                </div>
                {selectedChecks.length > 0 && (
                  <div style={checksRow}>
                    {selectedChecks.map(checkId => {
                      const check = getCheckStatus(user, checkId);
                      const checkInfo = CHECK_OPTIONS.find(c => c.id === checkId);
                      return <span key={checkId} style={checkStatus(check.present)}>{check.present ? '✓' : '−'} {checkInfo?.shortLabel}</span>;
                    })}
                  </div>
                )}
                <div style={linkButtons}>
                  {selectedChecks.includes('x') && user.username && <a href={`https://x.com/${user.username.replace('@', '')}`} target="_blank" rel="noopener" style={linkBtn}>View X</a>}
                  {selectedChecks.includes('telegram') && user.telegram && <a href={`https://t.me/${user.telegram.replace('@', '')}`} target="_blank" rel="noopener" style={linkBtn}>View TG</a>}
                  {selectedChecks.includes('wallet') && user.wallet && <a href={`https://etherscan.io/address/${user.wallet}`} target="_blank" rel="noopener" style={linkBtn}>View ETH</a>}
                  {selectedChecks.includes('sol') && user.sol_wallet && <a href={`https://solscan.io/address/${user.sol_wallet}`} target="_blank" rel="noopener" style={linkBtn}>View SOL</a>}
                  {selectedChecks.includes('comment_1') && user.comment_1 && <a href={user.comment_1} target="_blank" rel="noopener" style={linkBtn}>P1</a>}
                  {selectedChecks.includes('comment_2') && user.comment_2 && <a href={user.comment_2} target="_blank" rel="noopener" style={linkBtn}>P2</a>}
                  {selectedChecks.includes('comment_3') && user.comment_3 && <a href={user.comment_3} target="_blank" rel="noopener" style={linkBtn}>P3</a>}
                </div>
                <div style={userActions}>
                  <button onClick={() => updateUserReviewStatus(user.id, 'verified')} style={verifyBtn} disabled={saving}>✓</button>
                  <button onClick={() => updateUserReviewStatus(user.id, 'needs_improvement')} style={reviewBtn} disabled={saving}>✎</button>
                  <button onClick={() => { setDisqualifyTarget({ ids: [user.id], reason: '', note: '' }); setShowDisqualifyModal(true); }} style={disqualifyBtn} disabled={saving}>✗</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={footer}>Showing {Math.min(filteredUsers.length, 50)} of {filteredUsers.length}</div>
      </div>

      {selectedUser && (
        <div style={modalOverlay} onClick={() => setSelectedUser(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>@{selectedUser.username}</h2>
              <button style={closeBtn} onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div style={modalBody}>
              <div style={detailRow}><span style={detailLabel}>Status</span><span style={{...getStatusBadge(selectedUser.reviewStatus), ...reviewBadge}}>{getStatusBadge(selectedUser.reviewStatus).text}</span></div>
              <div style={detailRow}><span style={detailLabel}>Invited By</span><span style={detailValue}>{selectedUser.invitee || 'None'}</span></div>
              <div style={detailRow}><span style={detailLabel}>Referrals</span><span style={detailValue}>{selectedUser.referrals || 0}</span></div>
              <div style={detailRow}><span style={detailLabel}>MXP</span><span style={detailValue}>{selectedUser.mxp || selectedUser.gxp || 0}</span></div>
              <div style={detailSection}><span style={detailLabel}>Wallet</span><span style={detailValueSmall}>{selectedUser.wallet || 'Not provided'}</span></div>
              <div style={detailSection}><span style={detailLabel}>SOL Wallet</span><span style={detailValueSmall}>{selectedUser.sol_wallet || 'Not provided'}</span></div>
              <div style={detailSection}><span style={detailLabel}>Telegram</span><span style={detailValueSmall}>{selectedUser.telegram || 'Not provided'}</span></div>
              <div style={detailSection}><span style={detailLabel}>Review Notes</span><textarea value={selectedUser.reviewNotes || ''} onChange={e => setSelectedUser({...selectedUser, reviewNotes: e.target.value})} style={notesInput} placeholder="Add review notes..." /></div>
              {selectedUser.disqualifyReason && <div style={detailSection}><span style={detailLabel}>Reason</span><span style={detailValue}>{selectedUser.disqualifyReason}</span></div>}
            </div>
            <div style={modalActions}>
              <button onClick={() => updateUserReviewStatus(selectedUser.id, 'verified', selectedUser.reviewNotes)} style={modalVerifyBtn} disabled={saving}>✓ Verify</button>
              <button onClick={() => updateUserReviewStatus(selectedUser.id, 'needs_improvement', selectedUser.reviewNotes)} style={modalReviewBtn} disabled={saving}>✎ Review</button>
              <button onClick={() => { setDisqualifyTarget({ ids: [selectedUser.id], reason: selectedUser.disqualifyReason || '', note: '' }); setShowDisqualifyModal(true); }} style={modalDisqualifyBtn} disabled={saving}>✗ DQ</button>
            </div>
          </div>
        </div>
      )}

      {showDisqualifyModal && disqualifyTarget && (
        <div style={modalOverlay} onClick={() => setShowDisqualifyModal(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}><h2 style={modalTitle}>Disqualify {disqualifyTarget.ids.length > 1 ? `(${disqualifyTarget.ids.length} users)` : ''}</h2><button style={closeBtn} onClick={() => setShowDisqualifyModal(false)}>×</button></div>
            <div style={modalBody}>
              <p style={disqualifyPrompt}>Select reason:</p>
              {DISQUALIFY_REASONS.map(reason => (
                <label key={reason.value} style={radioLabel}>
                  <input type="radio" name="disqualifyReason" value={reason.value} checked={disqualifyTarget.reason === reason.value} onChange={e => setDisqualifyTarget({...disqualifyTarget, reason: e.target.value})} />
                  {reason.label}
                </label>
              ))}
              <div style={{marginTop: 16}}><span style={detailLabel}>Note (optional)</span><textarea value={disqualifyTarget.note || ''} onChange={e => setDisqualifyTarget({...disqualifyTarget, note: e.target.value})} style={notesInput} placeholder="Add a note..." /></div>
            </div>
            <div style={modalActions}>
              <button onClick={() => setShowDisqualifyModal(false)} style={modalCancelBtn}>Cancel</button>
              <button onClick={() => { if (disqualifyTarget.reason && disqualifyTarget.ids.length > 0) { disqualifyTarget.ids.forEach(id => updateUserReviewStatus(id, 'disqualified', disqualifyTarget.note, disqualifyTarget.reason)); setShowDisqualifyModal(false); setDisqualifyTarget(null); }}} style={modalDisqualifyBtn} disabled={saving || !disqualifyTarget.reason}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageWrap: React.CSSProperties = { minHeight: '100vh', background: '#EED5C1', padding: 20, fontFamily: "'Comic Neue', cursive" };
const shell: React.CSSProperties = { maxWidth: 560, margin: '0 auto', background: '#FAFAFA', borderRadius: 15, padding: 24, border: '3px solid #1E1E1E', boxShadow: '4px 4px 0 #8B5A2B' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 };
const headerButtons: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const titleStyle: React.CSSProperties = { color: '#9E1B1E', margin: 0, fontSize: 22, fontFamily: "'Anton', sans-serif", fontWeight: 'normal', letterSpacing: 1, textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 8, border: '3px solid #1E1E1E', fontSize: 14, fontFamily: "'Comic Neue', cursive", fontWeight: 700, marginBottom: 10, boxShadow: 'inset 2px 2px 0 #1E1E1E', background: '#FAFAFA' };
const selectStyle: React.CSSProperties = { padding: 10, borderRadius: 8, border: '3px solid #1E1E1E', fontSize: 13, background: '#FAFAFA', minWidth: 100, flex: 1, fontFamily: "'Comic Neue', cursive", fontWeight: 700 };
const primaryBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: '3px solid #1E1E1E', background: '#9E1B1E', color: '#FAFAFA', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Comic Neue', cursive", boxShadow: '3px 3px 0 #8B5A2B' };
const secondaryBtn: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '3px solid #1E1E1E', background: '#F28C28', color: '#1E1E1E', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Comic Neue', cursive", boxShadow: '3px 3px 0 #8B5A2B' };
const exportBtn: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '3px solid #1E1E1E', background: '#2e7d32', color: '#FAFAFA', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Comic Neue', cursive", boxShadow: '3px 3px 0 #8B5A2B' };
const errorStyle: React.CSSProperties = { color: '#C62828', fontWeight: 700, marginBottom: 12 };
const loginCard: React.CSSProperties = { maxWidth: 440, margin: '0 auto', background: '#FAFAFA', padding: 36, borderRadius: 15, border: '3px solid #1E1E1E', boxShadow: '4px 4px 0 #8B5A2B' };
const successBanner: React.CSSProperties = { background: '#F2F0A1', color: '#1E1E1E', padding: 12, borderRadius: 8, marginBottom: 14, fontWeight: 700, textAlign: 'center', fontSize: 14, border: '2px solid #1E1E1E' };
const statsBar: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 };
const statItem: React.CSSProperties = { background: '#F2F0A1', border: '3px solid #1E1E1E', borderRadius: 8, padding: 10, textAlign: 'center', boxShadow: '2px 2px 0 #8B5A2B' };
const statLabel: React.CSSProperties = { display: 'block', fontSize: 10, color: '#1E1E1E', opacity: 0.6, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' };
const statValue: React.CSSProperties = { display: 'block', fontSize: 16, fontWeight: 900, color: '#9E1B1E', fontFamily: "'Anton', sans-serif" };
const filterBar: React.CSSProperties = { marginBottom: 16 };
const filterRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' };
const checksBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: '3px solid #1E1E1E', background: '#FAFAFA', color: '#1E1E1E', fontWeight: 700, cursor: 'pointer', fontSize: 13, width: '100%', textAlign: 'left', fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const checksMenu: React.CSSProperties = { position: 'absolute', top: '100%', left: 0, right: 0, background: '#FAFAFA', border: '3px solid #1E1E1E', borderRadius: 10, padding: 12, zIndex: 100, marginTop: 4, boxShadow: '4px 4px 0 #8B5A2B' };
const checkLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#1E1E1E', fontWeight: 700 };
const batchBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EED5C1', border: '3px solid #1E1E1E', borderRadius: 10, padding: 12, marginBottom: 16, gap: 10, flexWrap: 'wrap', boxShadow: '2px 2px 0 #8B5A2B' };
const userList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const emptyState: React.CSSProperties = { textAlign: 'center', padding: 30, color: '#1E1E1E', opacity: 0.5, fontSize: 14 };
const userCard: React.CSSProperties = { background: '#FAFAFA', border: '3px solid #1E1E1E', borderRadius: 12, padding: 14, boxShadow: '3px 3px 0 #8B5A2B' };
const userCardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 };
const userMainInfo: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' };
const checkbox: React.CSSProperties = { width: 18, height: 18, cursor: 'pointer', accentColor: '#9E1B1E' };
const usernameLink: React.CSSProperties = { fontWeight: 800, color: '#9E1B1E', fontSize: 15, cursor: 'pointer', fontFamily: "'Anton', sans-serif", letterSpacing: 0.5 };
const inviteeTag: React.CSSProperties = { fontSize: 11, color: '#1E1E1E', background: '#F2F0A1', padding: '3px 8px', borderRadius: 6, border: '2px solid #1E1E1E', fontWeight: 700 };
const reviewBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '2px solid #1E1E1E' };
const userCardBody: React.CSSProperties = { display: 'flex', gap: 20, marginBottom: 10, paddingBottom: 10, borderBottom: '2px solid #1E1E1E' };
const userStat: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const userStatLabel: React.CSSProperties = { fontSize: 10, color: '#1E1E1E', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' };
const userStatValue: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: '#1E1E1E', fontFamily: "'Anton', sans-serif" };
const checksRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' };
const checkStatus = (present: boolean): React.CSSProperties => ({ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: present ? '#c8e6c9' : '#ffcdd2', color: present ? '#1b5e20' : '#b71c1c', border: `2px solid ${present ? '#2e7d32' : '#c62828'}` });
const linkButtons: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' };
const linkBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#F2F0A1', color: '#1E1E1E', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'inline-block', boxShadow: '2px 2px 0 #8B5A2B' };
const userActions: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const verifyBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#2e7d32', color: '#FAFAFA', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const reviewBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#F28C28', color: '#1E1E1E', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const disqualifyBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#9E1B1E', color: '#FAFAFA', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const footer: React.CSSProperties = { textAlign: 'center', padding: 16, color: '#1E1E1E', opacity: 0.5, fontSize: 12, borderTop: '2px solid #1E1E1E', marginTop: 16 };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(30,30,30,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 };
const modal: React.CSSProperties = { background: '#FAFAFA', borderRadius: 15, border: '3px solid #1E1E1E', width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto', boxShadow: '6px 6px 0 #8B5A2B' };
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '3px solid #1E1E1E', background: '#EED5C1', borderRadius: '12px 12px 0 0' };
const modalTitle: React.CSSProperties = { color: '#9E1B1E', margin: 0, fontSize: 18, fontFamily: "'Anton', sans-serif", fontWeight: 'normal', letterSpacing: 1, textTransform: 'uppercase' };
const closeBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 8, border: '3px solid #1E1E1E', background: '#FAFAFA', color: '#1E1E1E', fontSize: 20, cursor: 'pointer', fontWeight: 700, boxShadow: '2px 2px 0 #8B5A2B' };
const modalBody: React.CSSProperties = { padding: 16 };
const detailRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1E1E1E', opacity: 0.9 };
const detailSection: React.CSSProperties = { padding: '12px 0', borderBottom: '2px solid #1E1E1E' };
const detailLabel: React.CSSProperties = { fontSize: 12, color: '#1E1E1E', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' };
const detailValue: React.CSSProperties = { fontSize: 14, color: '#1E1E1E', fontWeight: 700 };
const detailValueSmall: React.CSSProperties = { fontSize: 12, color: '#1E1E1E', wordBreak: 'break-all', marginTop: 4, display: 'block', fontWeight: 700 };
const notesInput: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '3px solid #1E1E1E', fontSize: 13, marginTop: 8, minHeight: 60, resize: 'vertical', fontFamily: "'Comic Neue', cursive", fontWeight: 700 };
const modalActions: React.CSSProperties = { display: 'flex', gap: 8, padding: 16, borderTop: '3px solid #1E1E1E', flexWrap: 'wrap', background: '#EED5C1', borderRadius: '0 0 12px 12px' };
const modalVerifyBtn: React.CSSProperties = { flex: 1, padding: '12px 16px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#2e7d32', color: '#FAFAFA', fontWeight: 800, cursor: 'pointer', fontSize: 13, minWidth: 90, fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const modalReviewBtn: React.CSSProperties = { flex: 1, padding: '12px 16px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#F28C28', color: '#1E1E1E', fontWeight: 800, cursor: 'pointer', fontSize: 13, minWidth: 90, fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const modalDisqualifyBtn: React.CSSProperties = { flex: 1, padding: '12px 16px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#9E1B1E', color: '#FAFAFA', fontWeight: 800, cursor: 'pointer', fontSize: 13, minWidth: 90, fontFamily: "'Comic Neue', cursive", boxShadow: '2px 2px 0 #8B5A2B' };
const modalCancelBtn: React.CSSProperties = { flex: 1, padding: '12px 16px', borderRadius: 8, border: '2px solid #1E1E1E', background: '#FAFAFA', color: '#1E1E1E', fontWeight: 800, cursor: 'pointer', fontSize: 13, minWidth: 90, fontFamily: "'Comic Neue', cursive" };
const disqualifyPrompt: React.CSSProperties = { marginBottom: 16, color: '#1E1E1E', fontSize: 14, fontWeight: 700 };
const radioLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer', fontSize: 14, color: '#1E1E1E', fontWeight: 700 };
