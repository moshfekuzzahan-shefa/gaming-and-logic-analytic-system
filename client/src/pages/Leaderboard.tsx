import { useState, useEffect } from 'react';
import { Trophy, Flame, ChevronRight } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';

interface LeaderboardUser {
  id: number;
  username: string;
  current_streak: number;
  totalScore: number;
}

const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { id: 1, username: "EliteCoder99", current_streak: 15, totalScore: 3200 },
  { id: 2, username: "LogicMaster", current_streak: 8, totalScore: 2850 },
  { id: 3, username: "SyntaxTerror", current_streak: 12, totalScore: 2400 },
  { id: 4, username: "ByteMe", current_streak: 3, totalScore: 1900 },
  { id: 5, username: "CPlusPlusPro", current_streak: 5, totalScore: 1500 },
];

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.length > 0 ? data : MOCK_LEADERBOARD);
        } else {
          setUsers(MOCK_LEADERBOARD);
        }
      } catch (err) {
        console.warn('Backend not reachable. Using mock leaderboard.');
        setUsers(MOCK_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.3)]";
      case 1: return "text-gray-300 bg-gray-300/10 border-gray-300/20 shadow-[0_0_15px_rgba(209,213,219,0.2)]";
      case 2: return "text-amber-600 bg-amber-600/10 border-amber-600/20 shadow-[0_0_15px_rgba(217,119,6,0.2)]";
      default: return "text-gray-500 bg-dark-800 border-white/5";
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in relative">
      
      {/* Decorative Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white flex items-center justify-center gap-3 mb-3">
          <Trophy className="text-yellow-400 w-10 h-10" />
          Global Leaderboard
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          The most dedicated coders. Ranks are determined by the longest active learning streaks.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-primary-400 animate-pulse">Loading Rankings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-800/80 border-b border-white/10">
                  <th className="p-5 font-semibold text-gray-400 w-24 text-center">Rank</th>
                  <th className="p-5 font-semibold text-gray-400">Username</th>
                  <th className="p-5 font-semibold text-gray-400 text-center">Current Streak</th>
                  <th className="p-5 font-semibold text-gray-400 text-right">Total Score</th>
                  <th className="p-5 font-semibold text-gray-400 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    onClick={() => setSelectedUserId(user.id)}
                    className="border-b border-white/5 hover:bg-dark-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-5 text-center">
                      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold border ${getRankStyle(index)}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="font-semibold text-gray-200 group-hover:text-primary-400 transition-colors">
                        {user.username}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-dark-900/80 px-3 py-1 rounded-full border border-white/5">
                        <Flame className="text-orange-500 w-4 h-4" />
                        <span className="font-mono font-medium text-gray-300">{user.current_streak}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right font-mono font-medium text-accent-400">
                      {user.totalScore.toLocaleString()}
                    </td>
                    <td className="p-5 text-center text-gray-500 group-hover:text-accent-400 transition-colors">
                      <ChevronRight size={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}

    </div>
  );
}
