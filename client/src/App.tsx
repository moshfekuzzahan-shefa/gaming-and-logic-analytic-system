import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LevelExecution from './pages/LevelExecution';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import SocialPanel from './pages/SocialPanel';
import { useUser } from './context/UserContext';

function App() {
  const { userId, setUserId, availableUsers, username } = useUser();

  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-gray-100 font-sans">
        <header className="border-b border-white/10 bg-dark-800/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-primary-gradient">
              Gaming & Logic Analytic System
            </h1>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">Dashboard</Link>
              <Link to="/leaderboard" className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">Leaderboard</Link>
              <Link to="/social" className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">Network</Link>
              
              {/* User Switcher */}
              <div className="flex items-center gap-2 pl-6 border-l border-white/10">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Active:</span>
                <select 
                  value={userId} 
                  onChange={(e) => setUserId(parseInt(e.target.value))}
                  className="bg-dark-900 border border-white/10 rounded-lg px-2 py-1 text-sm font-medium text-primary-400 outline-none hover:border-primary-500/50 transition-all cursor-pointer"
                >
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
            </nav>
          </div>
        </header>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/level/:id" element={<LevelExecution />} />
            <Route path="/quiz/:categoryId" element={<Quiz />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/social" element={<SocialPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
