import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle, Code, Star, Trophy } from 'lucide-react';

interface Level {
  id: number;
  name: string;
  difficulty_level: string;
}

interface Category {
  id: number;
  name: string;
  levels: Level[];
}

interface Badge {
  id: number;
  badge_name: string;
  criteria: string;
}

interface UserStats {
  totalXP: number;
  totalLevelsPassed: number;
  unlockedBadges: Badge[];
}

// Fallback data in case backend is not running
const MOCK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'C++',
    levels: [
      { id: 1, name: 'Hello World in C++', difficulty_level: 'Beginner' },
      { id: 2, name: 'Variables and Data Types', difficulty_level: 'Beginner' },
      { id: 3, name: 'Control Flow (If/Else, Loops)', difficulty_level: 'Intermediate' },
      { id: 4, name: 'Pointers and References', difficulty_level: 'Advanced' },
    ]
  }
];

const MOCK_STATS: UserStats = {
  totalXP: 450,
  totalLevelsPassed: 2,
  unlockedBadges: [
    { id: 1, badge_name: 'First Blood', criteria: 'first_success' },
    { id: 2, badge_name: 'Speedster', criteria: 'fast_execution' },
  ]
};

import { useUser } from '../context/UserContext';

export default function Dashboard() {
  const { userId } = useUser();
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [stats, setStats] = useState<UserStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch from real backend, fallback to mock data on error
    const fetchData = async () => {
      try {
        const [levelsRes, statsRes] = await Promise.all([
          fetch('http://localhost:5000/api/levels'),
          fetch(`http://localhost:5000/api/users/${userId}/stats`)
        ]);

        if (levelsRes.ok && statsRes.ok) {
          const levelsData = await levelsRes.json();
          const statsData = await statsRes.json();
          if (levelsData.length > 0) setCategories(levelsData);
          setStats(statsData);
        }
      } catch (err) {
        console.warn('Backend not reachable. Using mock data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <div className="text-center py-20 animate-pulse text-primary-400">Loading Dashboard...</div>;

  const nextLevelXP = 1000;
  const progressPercent = Math.min((stats.totalXP / nextLevelXP) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Stats Header */}
      <section className="glass-card p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-primary-400/20 transition-all duration-700"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Star className="text-accent-400 w-8 h-8" />
              Welcome back, Player!
            </h2>
            <p className="text-gray-400">Ready to conquer your next coding challenge?</p>
          </div>

          <div className="bg-dark-800/80 p-6 rounded-xl border border-white/5 w-full md:w-96 shadow-lg">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-primary-400">Level 5 Hacker</span>
              <span className="text-gray-300 font-mono">{stats.totalXP} / {nextLevelXP} XP</span>
            </div>
            <div className="w-full bg-dark-900 rounded-full h-3 border border-white/5 overflow-hidden">
              <div 
                className="bg-primary-gradient h-3 rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Levels List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Code className="text-primary-400" />
            Campaign Modules
          </h3>
          
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category.id} className="glass-card p-6 relative">
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                   <h4 className="text-xl font-bold text-accent-400">{category.name}</h4>
                   <Link 
                     to={`/quiz/${category.id}`}
                     className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-4"
                   >
                     <Award size={16} className="text-primary-400" />
                     Take Quiz
                   </Link>
                </div>
                <div className="space-y-3">
                  {category.levels.map((level, index) => {
                    const isCompleted = index < stats.totalLevelsPassed; // Mock completion logic
                    
                    return (
                      <Link 
                        to={`/level/${level.id}`} 
                        key={level.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group
                          ${isCompleted ? 'bg-dark-800/40 border-green-500/20 hover:border-green-500/50' : 'bg-dark-800 border-white/5 hover:border-primary-500/50 hover:bg-dark-700/50'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-dark-900 text-gray-500'}`}>
                            {isCompleted ? <CheckCircle size={24} /> : <Code size={24} />}
                          </div>
                          <div>
                            <h5 className={`font-semibold ${isCompleted ? 'text-gray-200' : 'text-gray-100 group-hover:text-primary-400 transition-colors'}`}>{level.name}</h5>
                            <span className="text-xs px-2 py-1 rounded bg-dark-900 text-gray-400 mt-1 inline-block border border-white/5">
                              {level.difficulty_level}
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-primary-400 text-sm font-medium mr-2">
                            {isCompleted ? 'Replay' : 'Start'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-accent-400" />
            Achievements
          </h3>
          
          <div className="glass-card p-6">
            {stats.unlockedBadges.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Complete levels to earn badges!</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {stats.unlockedBadges.map((badge) => (
                  <div key={badge.id} className="bg-dark-800 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-accent-500/30 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(106,13,173,0.3)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all">
                      <Award className="text-white w-6 h-6" />
                    </div>
                    <span className="font-semibold text-sm text-gray-200">{badge.badge_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
