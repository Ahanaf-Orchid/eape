'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface CampaignTask {
  id: string;
  label: string;
  description: string;
  url: string;
  points: number;
  inputType: 'click' | 'link' | 'email' | 'text';
  required: boolean;
}

interface CampaignConfig {
  enabled: boolean;
  buttonLabel: string;
  pageTitle: string;
  version: number;
  tasks: Record<string, CampaignTask>;
}

const DEFAULT_TASK: CampaignTask = {
  id: '',
  label: '',
  description: '',
  url: '',
  points: 10,
  inputType: 'click',
  required: true,
};

const DEFAULT_CONFIG: CampaignConfig = {
  enabled: false,
  buttonLabel: 'JOIN DAILY CAMPAIGN',
  pageTitle: 'DAILY CAMPAIGN',
  version: 1,
  tasks: {},
};

export default function CampaignPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, login, logout, token } = useAdminAuth();
  const apiClient = token ? adminApi(token) : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && isClient) {
      loadConfig();
    }
  }, [isLoggedIn, isClient]);

  const loadConfig = async () => {
    if (!apiClient) return;
    try {
      const res = await apiClient.getConfig("campaign");
      const data = res?.value;
      
      if (data !== null) {
        setConfig({
          enabled: data.enabled ?? false,
          buttonLabel: data.buttonLabel ?? 'JOIN DAILY CAMPAIGN',
          pageTitle: data.pageTitle ?? 'DAILY CAMPAIGN',
          version: data.version ?? 1,
          tasks: data.tasks ?? {},
        });
      }
    } catch (error) {
      console.error('Load campaign config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const success = await login(email, password);
    if (!success) {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    logout();
    setIsEditing(false);
  };

  const saveConfig = async () => {
    if (!apiClient) return;
    setSaving(true);
    try {
      await apiClient.updateConfig("campaign", {
        enabled: config.enabled,
        buttonLabel: config.buttonLabel,
        pageTitle: config.pageTitle,
        version: config.version,
        tasks: config.tasks,
      });
      
      setSuccessMessage('Campaign saved successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
      setIsEditing(false);
    } catch (error) {
      console.error('Save campaign error:', error);
      setSuccessMessage('Error saving campaign!');
    }
    setSaving(false);
  };

  const addTask = () => {
    const taskId = `task_${Date.now()}`;
    const newTask: CampaignTask = {
      ...DEFAULT_TASK,
      id: taskId,
    };
    setConfig({
      ...config,
      tasks: {
        ...config.tasks,
        [taskId]: newTask,
      },
    });
  };

  const updateTask = (taskId: string, updates: Partial<CampaignTask>) => {
    setConfig({
      ...config,
      tasks: {
        ...config.tasks,
        [taskId]: { ...config.tasks[taskId], ...updates },
      },
    });
  };

  const removeTask = (taskId: string) => {
    const { [taskId]: removed, ...remaining } = config.tasks;
    setConfig({
      ...config,
      tasks: remaining,
    });
  };

  const incrementVersion = () => {
    setConfig({
      ...config,
      version: config.version + 1,
    });
  };

  const getTaskCount = () => Object.keys(config.tasks).length;

  const getTotalPotentialMxp = () => {
    let total = 0;
    Object.values(config.tasks).forEach((task: CampaignTask) => {
      total += task.points || 0;
    });
    return total;
  };

  if (!isClient || authLoading) return null;

  if (!isLoggedIn) {
    return (
      <div style={pageWrap}>
        <div style={loginCard}>
          <h2 style={{ color: '#ff6b9d', textAlign: 'center', marginBottom: 24, fontWeight: 800, letterSpacing: 1 }}>📋 CAMPAIGNS</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          {loginError && <p style={errorStyle}>{loginError}</p>}
          <button onClick={handleLogin} style={{ ...primaryBtn, width: '100%', padding: 14, fontSize: 14, marginBottom: 10 }}>
            LOGIN
          </button>
          <button onClick={() => router.push('/connectadmin')} style={{ ...secondaryBtn, width: '100%', padding: 14, fontSize: 14 }}>
            ← BACK TO ADMIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={shell}>
        <div style={header}>
          <h1 style={titleStyle}>📋 CAMPAIGNS</h1>
          <div style={headerButtons}>
            <button onClick={handleLogout} style={secondaryBtn}>Logout</button>
            <button onClick={() => router.push('/connectadmin')} style={secondaryBtn}>← Back</button>
          </div>
        </div>

        <div style={{ background: '#e3f2fd', border: '2px solid #2196f3', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#1565c0', fontWeight: 700 }}>
            ℹ️ This page controls the campaign page itself. Homepage campaign CTA visibility is controlled from <strong>/connectadmin/home</strong>.
          </p>
        </div>

        {successMessage && (
          <div style={successBanner}>{successMessage}</div>
        )}

        {loading ? (
          <div style={loadingStyle}>Loading campaign config...</div>
        ) : isEditing ? (
          <CampaignEditor
            config={config}
            onChange={setConfig}
            onSave={saveConfig}
            onCancel={() => setIsEditing(false)}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onRemoveTask={removeTask}
            onIncrementVersion={incrementVersion}
            saving={saving}
          />
        ) : (
          <>
            <div style={actionBar}>
              <button onClick={() => setIsEditing(true)} style={primaryBtn}>
                EDIT CAMPAIGN
              </button>
            </div>

            <div style={statsRow}>
              <div style={statCard}>
                <span style={statLabel}>Status</span>
                <span style={{...statValue, fontSize: 18, color: config.enabled ? '#28a745' : '#dc3545'}}>
                  {config.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <div style={statCard}>
                <span style={statLabel}>Version</span>
                <span style={statValue}>{config.version}</span>
              </div>
              <div style={statCard}>
                <span style={statLabel}>Tasks</span>
                <span style={statValue}>{getTaskCount()}</span>
              </div>
              <div style={{...statCard, background: '#FFF5F5'}}>
                <span style={{...statLabel, color: '#9E1B1E'}}>Total MXP</span>
                <span style={{...statValue, fontSize: 20, color: '#9E1B1E'}}>{getTotalPotentialMxp()}</span>
              </div>
            </div>

            <div style={configPreview}>
              <h3 style={sectionTitle}>Current Campaign Settings</h3>
              
              <div style={configRow}>
                <span style={configLabel}>Button Label:</span>
                <span style={configValue}>{config.buttonLabel}</span>
              </div>
              <div style={configRow}>
                <span style={configLabel}>Page Title:</span>
                <span style={configValue}>{config.pageTitle}</span>
              </div>
              <div style={configRow}>
                <span style={configLabel}>Enabled:</span>
                <span style={configValue}>{config.enabled ? 'Yes' : 'No'}</span>
              </div>

              <h4 style={tasksTitle}>Tasks ({getTaskCount()})</h4>
              {getTaskCount() === 0 ? (
                <div style={noTasks}>No tasks configured</div>
              ) : (
                <div style={tasksList}>
                  {Object.entries(config.tasks).map(([id, task]) => (
                    <div key={id} style={taskPreview}>
                      <div style={taskPreviewHeader}>
                        <span style={taskLabelPreview}>{task.label || '(No label)'}</span>
                        <span style={taskPointsPreview}>{task.points} MXP</span>
                      </div>
                      {task.url && (
                        <div style={taskUrlPreview}>🔗 {task.url}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CampaignEditor({
  config,
  onChange,
  onSave,
  onCancel,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onIncrementVersion,
  saving,
}: {
  config: CampaignConfig;
  onChange: (c: CampaignConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddTask: () => void;
  onUpdateTask: (id: string, updates: Partial<CampaignTask>) => void;
  onRemoveTask: (id: string) => void;
  onIncrementVersion: () => void;
  saving: boolean;
}) {
  const taskEntries = Object.entries(config.tasks);

  return (
    <div style={editorContainer}>
      <div style={section}>
        <h3 style={sectionTitle}>Campaign Settings</h3>
        <div style={formGrid}>
          <div style={formGroup}>
            <label style={labelStyle}>Button Label</label>
            <input
              type="text"
              value={config.buttonLabel}
              onChange={(e) => onChange({ ...config, buttonLabel: e.target.value })}
              style={inputStyle}
              placeholder="JOIN DAILY CAMPAIGN"
            />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Page Title</label>
            <input
              type="text"
              value={config.pageTitle}
              onChange={(e) => onChange({ ...config, pageTitle: e.target.value })}
              style={inputStyle}
              placeholder="DAILY CAMPAIGN"
            />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Enabled</label>
            <select
              value={config.enabled ? 'true' : 'false'}
              onChange={(e) => onChange({ ...config, enabled: e.target.value === 'true' })}
              style={inputStyle}
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Version</label>
            <div style={versionRow}>
              <span style={versionDisplay}>{config.version}</span>
              <button onClick={onIncrementVersion} style={versionBtn}>+ BUMP</button>
            </div>
            <span style={versionHint}>Bump version to reset user progress</span>
          </div>
        </div>
      </div>

      <div style={section}>
        <div style={sectionHeader}>
          <h3 style={sectionTitle}>Tasks</h3>
          <button onClick={onAddTask} style={addBtn}>+ ADD TASK</button>
        </div>
        {taskEntries.length === 0 ? (
          <div style={emptyTasks}>No tasks yet. Add your first task!</div>
        ) : (
          <div style={tasksList}>
            {taskEntries.map(([id, task], index) => (
              <div key={id} style={taskCard}>
                <div style={taskHeader}>
                  <span style={taskNumber}>Task {index + 1}</span>
                  <button onClick={() => onRemoveTask(id)} style={removeTaskBtn}>✕</button>
                </div>
                <div style={taskGrid}>
                  <div style={formGroup}>
                    <label style={labelStyle}>Label</label>
                    <input
                      type="text"
                      value={task.label}
                      onChange={(e) => onUpdateTask(id, { label: e.target.value })}
                      style={inputStyle}
                      placeholder="Task label"
                    />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Points (MXP)</label>
                    <input
                      type="number"
                      value={task.points}
                      onChange={(e) => onUpdateTask(id, { points: parseInt(e.target.value) || 0 })}
                      style={inputStyle}
                    />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Input Type</label>
                    <select
                      value={task.inputType}
                      onChange={(e) => onUpdateTask(id, { inputType: e.target.value as CampaignTask['inputType'] })}
                      style={inputStyle}
                    >
                      <option value="click">Click Only</option>
                      <option value="link">Link/URL</option>
                      <option value="email">Email</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  <div style={formGroupFull}>
                    <label style={labelStyle}>URL (optional)</label>
                    <input
                      type="url"
                      value={task.url}
                      onChange={(e) => onUpdateTask(id, { url: e.target.value })}
                      style={inputStyle}
                      placeholder="https://..."
                    />
                  </div>
                  <div style={formGroup}>
                    <label style={checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={task.required}
                        onChange={(e) => onUpdateTask(id, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={editorActions}>
        <button onClick={onCancel} style={cancelBtn}>CANCEL</button>
        <button onClick={onSave} style={saveBtn} disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE CAMPAIGN'}
        </button>
      </div>
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  minHeight: '100vh',
  background: '#EED5C1',
  padding: 20,
  fontFamily: "'Comic Neue', cursive",
};

const shell: React.CSSProperties = {
  maxWidth: 540,
  margin: '0 auto',
  background: '#FAFAFA',
  borderRadius: 15,
  padding: 24,
  border: '3px solid #1E1E1E',
  boxShadow: '4px 4px 0 #8B5A2B',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  flexWrap: 'wrap',
  gap: 12,
};

const headerButtons: React.CSSProperties = {
  display: 'flex',
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  color: '#9E1B1E',
  margin: 0,
  fontSize: 22,
  fontFamily: "'Anton', sans-serif",
  fontWeight: 'normal',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: '3px solid #1E1E1E',
  fontSize: 14,
  fontFamily: "'Comic Neue', cursive",
  fontWeight: 700,
  marginBottom: 10,
  background: '#FAFAFA',
  boxShadow: 'inset 2px 2px 0 #1E1E1E',
};

const primaryBtn: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 10,
  border: '3px solid #1E1E1E',
  background: '#9E1B1E',
  color: '#FAFAFA',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: "'Comic Neue', cursive",
  boxShadow: '3px 3px 0 #8B5A2B',
};

const secondaryBtn: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 10,
  border: '3px solid #1E1E1E',
  background: '#F28C28',
  color: '#1E1E1E',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: "'Comic Neue', cursive",
  boxShadow: '3px 3px 0 #8B5A2B',
};

const errorStyle: React.CSSProperties = {
  color: '#C62828',
  fontWeight: 700,
  marginBottom: 12,
};

const successBanner: React.CSSProperties = {
  background: '#F2F0A1',
  color: '#1E1E1E',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  fontWeight: 700,
  textAlign: 'center',
  border: '2px solid #1E1E1E',
};

const loginCard: React.CSSProperties = {
  maxWidth: 440,
  margin: '0 auto',
  background: '#FAFAFA',
  padding: 40,
  borderRadius: 15,
  border: '3px solid #1E1E1E',
  boxShadow: '4px 4px 0 #8B5A2B',
};

const actionBar: React.CSSProperties = {
  marginBottom: 20,
};

const statsRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginBottom: 24,
};

const statCard: React.CSSProperties = {
  background: '#F2F0A1',
  border: '3px solid #1E1E1E',
  borderRadius: 10,
  padding: 16,
  textAlign: 'center',
  boxShadow: '2px 2px 0 #8B5A2B',
};

const statLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#1E1E1E',
  opacity: 0.6,
  marginBottom: 4,
  fontWeight: 700,
  textTransform: 'uppercase',
};

const statValue: React.CSSProperties = {
  display: 'block',
  fontSize: 28,
  fontWeight: 900,
  color: '#9E1B1E',
  fontFamily: "'Anton', sans-serif",
};

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40,
  color: '#1E1E1E',
  opacity: 0.5,
};

const configPreview: React.CSSProperties = {
  background: '#EED5C1',
  borderRadius: 10,
  padding: 20,
  border: '2px solid #1E1E1E',
};

const configRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #1E1E1E',
};

const configLabel: React.CSSProperties = {
  fontWeight: 700,
  color: '#1E1E1E',
  opacity: 0.6,
  fontSize: 14,
};

const configValue: React.CSSProperties = {
  fontWeight: 700,
  color: '#1E1E1E',
  fontSize: 14,
};

const tasksTitle: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 12,
  color: '#9E1B1E',
  fontSize: 14,
  fontFamily: "'Anton', sans-serif",
  fontWeight: 'normal',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const noTasks: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  color: '#1E1E1E',
  opacity: 0.5,
  background: '#FAFAFA',
  borderRadius: 8,
  border: '2px solid #1E1E1E',
};

const tasksList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const taskPreview: React.CSSProperties = {
  background: '#FAFAFA',
  border: '3px solid #1E1E1E',
  borderRadius: 10,
  padding: 12,
  boxShadow: '2px 2px 0 #8B5A2B',
};

const taskPreviewHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const taskLabelPreview: React.CSSProperties = {
  fontWeight: 700,
  color: '#1E1E1E',
  fontSize: 14,
};

const taskPointsPreview: React.CSSProperties = {
  background: '#9E1B1E',
  color: '#FAFAFA',
  padding: '4px 8px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  border: '2px solid #1E1E1E',
};

const taskUrlPreview: React.CSSProperties = {
  fontSize: 11,
  color: '#1E1E1E',
  opacity: 0.5,
  marginTop: 4,
  wordBreak: 'break-all',
};

const editorContainer: React.CSSProperties = {
  background: '#EED5C1',
  borderRadius: 12,
  padding: 20,
  border: '2px solid #1E1E1E',
};

const section: React.CSSProperties = {
  marginBottom: 24,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const sectionTitle: React.CSSProperties = {
  color: '#9E1B1E',
  margin: '0 0 12px 0',
  fontSize: 16,
  fontFamily: "'Anton', sans-serif",
  fontWeight: 'normal',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const formGroup: React.CSSProperties = {
  marginBottom: 12,
};

const formGroupFull: React.CSSProperties = {
  gridColumn: '1 / -1',
  marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 700,
  color: '#1E1E1E',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const versionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const versionDisplay: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: '#ff6b9d',
};

const versionBtn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#28a745',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 12,
};

const versionHint: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  color: '#999',
  marginTop: 4,
};

const checkboxLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 700,
  color: '#4a4a4a',
  marginTop: 28,
  cursor: 'pointer',
};

const addBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#28a745',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 12,
};

const emptyTasks: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  color: '#999',
  background: '#fff',
  borderRadius: 12,
};

const taskCard: React.CSSProperties = {
  background: '#fff',
  border: '2px solid #ffd6e0',
  borderRadius: 12,
  padding: 12,
};

const taskHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const taskNumber: React.CSSProperties = {
  fontWeight: 800,
  color: '#ff6b9d',
  fontSize: 14,
};

const removeTaskBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 6,
  border: 'none',
  background: '#ff4444',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};

const taskGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
};

const editorActions: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  justifyContent: 'flex-end',
  marginTop: 20,
};

const cancelBtn: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 12,
  border: '1px solid #ffd6e0',
  background: '#fff',
  color: '#666',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 14,
};

const saveBtn: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 12,
  border: 'none',
  background: '#28a745',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 14,
};
