import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import {
  PlusCircle,
  Trash,
  Folder,
  Trophy,
  Code,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Level {
  id: number;
  name: string;
  category_id: number;
  category_name: string | null;
  difficulty_level: string;
  reward_xp: number;
  problem_statement: string | null;
  boilerplate_code: string | null;
  expected_output: string | null;
}

export default function LevelsTab() {
  const { token } = useUser();
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [rewardXp, setRewardXp] = useState('100');
  const [problemStatement, setProblemStatement] = useState('');
  const [boilerplateCode, setBoilerplateCode] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  const fetchCategories = async () => {
    if (!token) return; // Wait until we have the token

    try {
      // Changed to hit the protected admin route WITH the auth token!
      const res = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await res.json();
      const mappedCats = data.map((c: any) => ({
        id: c.id,
        name: c.name
      }));
      setCategories(mappedCats);
      if (mappedCats.length > 0) {
        setCategoryId(String(mappedCats[0].id));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchLevels = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/levels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch levels registry');
      }
      const data = await res.json();
      setLevels(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading level configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (token) {
      fetchLevels();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !difficultyLevel) {
      setError('Please fill in all required fields (Title, Category, Difficulty).');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          category_id: categoryId,
          difficulty_level: difficultyLevel,
          reward_xp: rewardXp,
          problem_statement: problemStatement.trim(),
          boilerplate_code: boilerplateCode,
          expected_output: expectedOutput.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create new level');
      }

      setSuccess('Level successfully created!');

      // Clear form
      setName('');
      setProblemStatement('');
      setBoilerplateCode('');
      setExpectedOutput('');
      setRewardXp('100');
      if (categories.length > 0) {
        setCategoryId(String(categories[0].id));
      } else {
        setCategoryId('');
      }
      setDifficultyLevel('');

      // Reload levels list
      const levelsRes = await fetch('/api/admin/levels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (levelsRes.ok) {
        const data = await levelsRes.json();
        setLevels(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create level.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLevel = async (id: number) => {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/levels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete level');
      }

      setSuccess('Level deleted successfully.');
      setLevels(prev => prev.filter(l => l.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete level.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-accent-400 font-mono space-y-4">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="text-sm tracking-wider uppercase">Loading Level Configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-4 flex gap-3 text-red-300">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-red-200">Execution Exception</h4>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-mono text-red-400 hover:text-red-300 cursor-pointer self-start">[dismiss]</button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/35 rounded-2xl p-4 flex gap-3 text-green-300">
          <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-green-200">Action Complete</h4>
            <p className="text-xs text-green-300/80 mt-1">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-xs font-mono text-green-400 hover:text-green-300 cursor-pointer self-start">[dismiss]</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Create Level Form Panel */}
        <div className="xl:col-span-1 glass-card p-6 border border-white/5 space-y-5 h-fit relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <h4 className="font-bold text-md text-gray-200 flex items-center gap-2 border-b border-white/5 pb-3">
            <PlusCircle size={18} className="text-accent-400" />
            Create Challenge Node
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title / Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Level Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Recursive Fibonacci"
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-400/40 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Category *</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-400/40 transition-all font-semibold cursor-pointer"
                >
                  {/* FIX 2: Default disabled option */}
                  <option value="" disabled className="bg-dark-900 text-gray-500">Select a Category...</option>

                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-dark-900">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Difficulty *</label>
                <select
                  value={difficultyLevel}
                  onChange={e => setDifficultyLevel(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-400/40 transition-all font-semibold cursor-pointer"
                >
                  <option value="" disabled className="bg-dark-900 text-gray-500">Select Difficulty...</option>
                  <option value="Beginner" className="bg-dark-900">Beginner</option>
                  <option value="Intermediate" className="bg-dark-900">Intermediate</option>
                  <option value="Advanced" className="bg-dark-900">Advanced</option>
                </select>
              </div>
            </div>

            {/* Reward XP & Expected Output */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Reward XP</label>
                <input
                  type="number"
                  min="0"
                  value={rewardXp}
                  onChange={e => setRewardXp(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-400/40 transition-all font-semibold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Expected Output</label>
                <input
                  type="text"
                  value={expectedOutput}
                  onChange={e => setExpectedOutput(e.target.value)}
                  placeholder="e.g. 55"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent-400/40 transition-all font-semibold font-mono"
                />
              </div>
            </div>

            {/* Problem Statement */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Problem Statement</label>
              <textarea
                rows={3}
                value={problemStatement}
                onChange={e => setProblemStatement(e.target.value)}
                placeholder="Describe the logic puzzle requirements..."
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-400/40 transition-all leading-relaxed"
              />
            </div>

            {/* Boilerplate Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Code size={12} className="text-accent-400" />
                C++ Boilerplate Code
              </label>
              <textarea
                rows={4}
                value={boilerplateCode}
                onChange={e => setBoilerplateCode(e.target.value)}
                placeholder={`#include <iostream>\nusing namespace std;\n\nint main() {\n  // Code logic here\n  return 0;\n}`}
                className="w-full bg-dark-900/90 border border-white/10 rounded-xl p-3 text-xs text-green-400 focus:outline-none focus:border-accent-400/40 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Configuring Node...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Publish Challenge</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Level List Panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card p-5 border border-white/5 overflow-hidden">
            <h4 className="font-bold text-md text-gray-200 flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Folder size={18} className="text-accent-400" />
              Published Challenge Nodes
            </h4>

            {levels.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-mono text-xs">
                NO REGISTERED CHALLENGES DETECTED
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 pb-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                      <th className="py-2.5 px-2">ID</th>
                      <th className="py-2.5 px-2">Title</th>
                      <th className="py-2.5 px-2">Category</th>
                      <th className="py-2.5 px-2">Difficulty</th>
                      <th className="py-2.5 px-2">Award</th>
                      <th className="py-2.5 px-2 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((l) => {
                      const isConfirming = confirmDeleteId === l.id;

                      return (
                        <tr
                          key={l.id}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-all text-sm text-gray-300"
                        >
                          {/* ID */}
                          <td className="py-3.5 px-2 font-mono text-xs text-accent-400">
                            #{l.id}
                          </td>

                          {/* Title */}
                          <td className="py-3.5 px-2 font-semibold text-gray-200">
                            {l.name}
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-2 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Folder size={12} className="text-gray-500" />
                              <span>{l.category_name || 'Unassigned'}</span>
                            </div>
                          </td>

                          {/* Difficulty */}
                          <td className="py-3.5 px-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${l.difficulty_level === 'Beginner'
                              ? 'bg-green-500/10 border-green-500/25 text-green-400'
                              : l.difficulty_level === 'Intermediate'
                                ? 'bg-accent-500/10 border-accent-500/25 text-accent-400'
                                : 'bg-red-500/10 border-red-500/25 text-red-400'
                              }`}>
                              {l.difficulty_level.toUpperCase()}
                            </span>
                          </td>

                          {/* Reward XP */}
                          <td className="py-3.5 px-2 font-mono text-xs text-accent-400">
                            <div className="flex items-center gap-1">
                              <Trophy size={12} />
                              <span>+{l.reward_xp} XP</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-2 text-right">
                            {isConfirming ? (
                              <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                <span className="text-red-400 text-[10px] font-bold flex items-center gap-0.5">
                                  <AlertTriangle size={12} className="animate-pulse" />
                                  Confirm?
                                </span>
                                <button
                                  onClick={() => handleDeleteLevel(l.id)}
                                  disabled={deletingId === l.id}
                                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] py-1 px-2 rounded transition-all cursor-pointer"
                                >
                                  {deletingId === l.id ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="bg-dark-600 hover:bg-dark-500 text-gray-300 font-bold text-[9px] py-1 px-2 rounded border border-white/5 transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(l.id)}
                                className="text-red-400 border border-red-500/25 bg-red-500/5 hover:bg-red-500/20 hover:text-red-300 font-semibold text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all ml-auto cursor-pointer"
                              >
                                <Trash size={12} />
                                Delete
                              </button>
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
      </div>
    </div>
  );
}