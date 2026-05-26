import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Users, Code, Activity, Terminal, ShieldCheck, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import UsersTab from '../components/admin/UsersTab';
import LevelsTab from '../components/admin/LevelsTab';

interface Stats {
  totalUsers: number;
  totalLevels: number;
  totalAttempts: number;
}

interface TelemetryAttempt {
  id: number;
  username: string;
  levelName: string;
  timeTaken: number;
  isSuccess: boolean;
  score: number;
}

export default function AdminDashboard() {
  const { token } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<TelemetryAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'users' | 'levels'>('telemetry');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[INIT] Initializing Administrative Control Panel...',
    '[SEC] Securing logic decryption bridges...',
    '[AUTH] Verifying Administrator access rights... [OK]'
  ]);

  const addConsoleLog = (msg: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8)); // Limit to last 8 logs
  };

  const fetchAdminStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      addConsoleLog('Connecting to backend telemetry REST endpoint...');
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Access denied or statistics fetching failed.');
      }

      const data = await res.json();
      setStats(data.stats);
      setRecentAttempts(data.recentAttempts || []);
      
      addConsoleLog('Telemetry database logs successfully loaded.');
      addConsoleLog(`Loaded stats - Players: ${data.stats.totalUsers}, Levels: ${data.stats.totalLevels}, Submissions: ${data.stats.totalAttempts}`);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with admin API.');
      addConsoleLog('ERROR: Telemetry fetching failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    
    // Setup interval for fake logic telemetry updates
    const interval = setInterval(() => {
      const systemMessages = [
        'Security heartbeat active.',
        'Postgres connections healthy.',
        'Neon server latency: 42ms.',
        'C++ execution sandbox idle.',
        'Clearing temporary build buffers...',
        'JWT token encryption signature verified.'
      ];
      const randomMsg = systemMessages[Math.floor(Math.random() * systemMessages.length)];
      if (randomMsg) {
        addConsoleLog(`SYSTEM: ${randomMsg}`);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 animate-pulse text-primary-400 font-mono">
        <RefreshCw className="animate-spin w-10 h-10 mx-auto mb-4" />
        LOADING SYSTEM METRICS...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-6">
      
      {/* Header Panel */}
      <section className="glass-card p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-accent-400/20 transition-all duration-700"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ShieldCheck className="text-accent-400 w-8 h-8" />
              Administrative Core Console
            </h2>
            <p className="text-gray-400 text-sm">
              Role-Based Access Control verified. System metrics and database telemetry are online.
            </p>
          </div>
          
          <button
            onClick={() => fetchAdminStats(true)}
            disabled={refreshing}
            className="btn-secondary text-xs font-semibold py-2.5 px-4 flex items-center gap-2 rounded-xl border border-white/10 hover:bg-dark-800 hover:border-accent-400/40 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Force Telemetry Sync'}
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-4 flex gap-3 text-red-300">
          <AlertTriangle size={24} className="text-red-400 shrink-0" />
          <div>
            <h4 className="font-bold text-red-200">Telemetry Fetch Exception</h4>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-4 px-6 text-sm font-semibold tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'telemetry' 
              ? 'text-accent-400 font-bold' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity size={16} />
            <span>System Telemetry</span>
          </div>
          {activeTab === 'telemetry' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-6 text-sm font-semibold tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'users' 
              ? 'text-accent-400 font-bold' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>User Management</span>
          </div>
          {activeTab === 'users' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={`pb-4 px-6 text-sm font-semibold tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'levels' 
              ? 'text-accent-400 font-bold' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Code size={16} />
            <span>Level Editor</span>
          </div>
          {activeTab === 'levels' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></span>
          )}
        </button>
      </div>

      {activeTab === 'telemetry' ? (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <div className="glass-card p-6 border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/25 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary-500/10 text-primary-400 rounded-xl border border-primary-500/15">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1">
                Registered Players
              </span>
              <span className="text-3xl font-extrabold text-gray-100 font-mono">
                {stats?.totalUsers}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
            <span>Database Table: [users]</span>
            <span className="text-green-400 flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span> ONLINE
            </span>
          </div>
        </div>

        {/* Total Levels */}
        <div className="glass-card p-6 border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full blur-2xl group-hover:bg-accent-500/25 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-accent-500/10 text-accent-400 rounded-xl border border-accent-500/15">
              <Code size={24} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1">
                Active Levels
              </span>
              <span className="text-3xl font-extrabold text-gray-100 font-mono">
                {stats?.totalLevels}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
            <span>Database Table: [levels]</span>
            <span className="text-green-400 flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span> ACTIVE
            </span>
          </div>
        </div>

        {/* Total Attempts */}
        <div className="glass-card p-6 border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/25 transition-all"></div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-green-500/10 text-green-400 rounded-xl border border-green-500/15">
              <Activity size={24} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1">
                Code Submissions
              </span>
              <span className="text-3xl font-extrabold text-gray-100 font-mono">
                {stats?.totalAttempts}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
            <span>Database Table: [attempts]</span>
            <span className="text-green-400 flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span> SECURE
            </span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Attempts Telemetry Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Database className="text-primary-400" />
            Database Code Attempts Log
          </h3>
          
          <div className="glass-card p-5 border border-white/5 overflow-hidden">
            {recentAttempts.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">No attempts loaded in session.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 pb-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                      <th className="py-2.5">Player</th>
                      <th className="py-2.5">Challenge Level</th>
                      <th className="py-2.5">Execution Status</th>
                      <th className="py-2.5 text-right">Award</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.map((attempt) => (
                      <tr 
                        key={attempt.id} 
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-all text-sm text-gray-300"
                      >
                        <td className="py-3 font-semibold text-gray-200">{attempt.username}</td>
                        <td className="py-3">{attempt.levelName}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shadow-[0_0_10px_rgba(0,0,0,0.3)] ${
                            attempt.isSuccess 
                              ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.15)]' 
                              : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${attempt.isSuccess ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            {attempt.isSuccess ? 'COMPILER MATCH' : 'COMPILER EXCEPTION'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-xs text-accent-400">+{attempt.score} XP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* High-Tech Terminal Logic Console */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="text-accent-400" />
            Logic Decryptor Console
          </h3>
          
          <div className="glass-card p-5 border border-white/5 bg-dark-900/90 font-mono text-xs text-green-400 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden h-[300px] flex flex-col justify-between">
            {/* Gloss shine reflection overlay */}
            <div className="absolute top-0 right-0 left-0 h-[30%] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>
            
            <div className="space-y-2 overflow-y-auto pr-2 scrollbar-none flex-1">
              {consoleLogs.map((log, index) => (
                <div key={index} className="leading-relaxed hover:text-green-300 transition-colors">
                  {log}
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/5 pt-3 mt-2 flex items-center justify-between text-[10px] text-gray-500 select-none">
              <span>ADMIN CLEARANCE: LEVEL-5</span>
              <span>DEVMODE: ACTIVE</span>
            </div>
          </div>
        </div>

      </div>
        </>
      ) : activeTab === 'users' ? (
        <UsersTab />
      ) : (
        <LevelsTab />
      )}

    </div>
  );
}
