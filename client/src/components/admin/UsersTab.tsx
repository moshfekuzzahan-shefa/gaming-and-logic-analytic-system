import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import {
  Shield,
  ShieldAlert,
  UserMinus,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  User as UserIcon,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  join_date: string;
}

export default function UsersTab() {
  const { token, userId: currentAdminId } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmBanId, setConfirmBanId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch users list');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleToggleRole = async (targetUser: User) => {
    if (updatingId) return;
    const newRole = targetUser.role === 'admin' ? 'player' : 'admin';
    setUpdatingId(targetUser.id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update user role');
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBanUser = async (id: number) => {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete user');
      }

      // Remove from local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== id));
      setConfirmBanId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-accent-400 font-mono space-y-4">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="text-sm tracking-wider uppercase">Querying user registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserIcon className="text-accent-400" />
            User Registry Management
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Grant administrative rights, toggle roles, and terminate user profiles.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 rounded-xl border border-white/10 hover:bg-dark-800 hover:border-accent-400/40 transition-all cursor-pointer"
        >
          <RefreshCw size={12} />
          Refresh Registry
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-4 flex gap-3 text-red-300">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-red-200">Execution Exception</h4>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-mono text-red-400 hover:text-red-300 cursor-pointer self-start"
          >
            [dismiss]
          </button>
        </div>
      )}

      <div className="glass-card p-5 border border-white/5 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-10">
            <UserIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No registered users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 pb-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="py-2.5 px-3">UID</th>
                  <th className="py-2.5 px-3">User Profile</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Security Level</th>
                  <th className="py-2.5 px-3">Enrolled On</th>
                  <th className="py-2.5 px-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentUser = u.id === currentAdminId;
                  const isConfirmingBan = confirmBanId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-all text-sm text-gray-300"
                    >
                      {/* UID */}
                      <td className="py-4 px-3 font-mono text-xs text-accent-400">
                        #{u.id}
                      </td>

                      {/* Username */}
                      <td className="py-4 px-3 font-semibold text-gray-100">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg text-xs ${u.role === 'admin'
                              ? 'bg-accent-500/10 text-accent-400'
                              : 'bg-primary-500/10 text-primary-400'
                            }`}>
                            <UserIcon size={14} />
                          </div>
                          <span>{u.username}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                          <Mail size={12} className="text-gray-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shadow-[0_0_10px_rgba(0,0,0,0.3)] ${u.role === 'admin'
                            ? 'bg-accent-500/10 border-accent-500/20 text-accent-400 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                            : 'bg-dark-600 border-white/5 text-gray-400'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.role === 'admin' ? 'bg-accent-400 animate-pulse' : 'bg-gray-500'}`}></span>
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Join Date */}
                      <td className="py-4 px-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-500" />
                          <span>{new Date(u.join_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        {isConfirmingBan ? (
                          <div className="flex items-center justify-end gap-2 animate-fade-in">
                            <span className="text-red-400 text-xs font-semibold flex items-center gap-1">
                              <ShieldAlert size={14} className="animate-pulse" />
                              Confirm Ban?
                            </span>
                            <button
                              onClick={() => handleBanUser(u.id)}
                              disabled={deletingId === u.id}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            >
                              {deletingId === u.id ? 'Deleting...' : 'Yes, Ban'}
                            </button>
                            <button
                              onClick={() => setConfirmBanId(null)}
                              className="bg-dark-600 hover:bg-dark-500 text-gray-300 font-bold text-[10px] py-1 px-2.5 rounded-lg border border-white/5 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Role Button */}
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={updatingId === u.id || isCurrentUser}
                              className={`text-[11px] font-semibold py-1.5 px-3 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${isCurrentUser
                                  ? 'bg-transparent border-white/5 text-gray-600 cursor-not-allowed'
                                  : u.role === 'admin'
                                    ? 'bg-dark-600/50 border-white/10 text-gray-300 hover:bg-dark-600 hover:text-white'
                                    : 'bg-accent-500/10 border-accent-500/20 text-accent-400 hover:bg-accent-500/20 hover:text-accent-300'
                                }`}
                              title={isCurrentUser ? "You cannot modify your own administrative rank." : `Change to ${u.role === 'admin' ? 'player' : 'admin'}`}
                            >
                              <UserCheck size={12} />
                              {updatingId === u.id
                                ? 'Updating...'
                                : u.role === 'admin'
                                  ? 'Make Player'
                                  : 'Make Admin'
                              }
                            </button>

                            {/* Delete/Ban Button */}
                            <button
                              onClick={() => setConfirmBanId(u.id)}
                              disabled={isCurrentUser}
                              className={`text-[11px] font-semibold py-1.5 px-3 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${isCurrentUser
                                  ? 'bg-transparent border-white/5 text-gray-600 cursor-not-allowed'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25 hover:text-red-300 hover:shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                }`}
                              title={isCurrentUser ? "You cannot ban yourself." : "Ban User Profile"}
                            >
                              <UserMinus size={12} />
                              Ban User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
