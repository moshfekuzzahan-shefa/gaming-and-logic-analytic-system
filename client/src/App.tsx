import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LevelExecution from './pages/LevelExecution';
import Quiz from './pages/Quiz';
import Leaderboard from './pages/Leaderboard';
import SocialPanel from './pages/SocialPanel';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import { useUser } from './context/UserContext';
import { LogOut, User as UserIcon, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

function AccessDeniedView() {
  return (
    <div className="max-w-md mx-auto text-center py-16 px-8 glass-card border border-red-500/25 relative overflow-hidden shadow-[0_0_35px_rgba(239,68,68,0.15)] my-10 animate-shake">
      {/* Red accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500"></div>
      
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse">
        <ShieldAlert className="text-red-400 w-8 h-8" />
      </div>
      
      <h3 className="text-2xl font-bold text-red-200 mb-3 font-mono tracking-wider">
        ACCESS RESTRICT EXCEPTION
      </h3>
      
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        Your security clearance level is insufficient. Administrative signatures are required to decrypted this interface node.
      </p>
      
      <Link 
        to="/" 
        className="btn-secondary text-xs py-2.5 px-6 rounded-xl inline-block border border-white/10 hover:border-red-500/40 hover:text-red-400 transition-all font-semibold cursor-pointer"
      >
        Return to Core Interface
      </Link>
    </div>
  );
}

function App() {
  const { username, logout, loading, isAuthenticated, isAdmin } = useUser();

  // 1. Beautiful high-tech loading screen while validating JWT signature
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-primary-400 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-accent-400 animate-pulse" />
          </div>
        </div>
        <span className="text-xs font-mono tracking-widest text-gray-400 animate-pulse">
          DECRYPTING SECURITY TOKEN & CORES...
        </span>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-gray-100 font-sans flex flex-col">
        
        {/* Navigation Header */}
        <header className="border-b border-white/10 bg-dark-800/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-primary-gradient flex items-center gap-2">
              <Shield className="text-accent-400 w-5 h-5" />
              Gaming & Logic Analytic System
            </Link>
            
            {isAuthenticated && (
              <nav className="flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">
                  Dashboard
                </Link>
                <Link to="/leaderboard" className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">
                  Leaderboard
                </Link>
                <Link to="/social" className="text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">
                  Network
                </Link>

                {/* Glowing Admin link (Only visible to admin role) */}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="text-sm font-semibold text-accent-400 hover:text-accent-300 flex items-center gap-1.5 transition-colors relative group py-1 px-2.5 rounded-lg border border-accent-400/20 bg-accent-400/5 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:bg-accent-400/10 transition-all duration-300"
                  >
                    <ShieldCheck size={14} className="text-accent-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                
                {/* Active Authenticated User Badge & Logout */}
                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                  <div className="flex items-center gap-2.5 bg-dark-900/80 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                      <UserIcon size={12} className="text-primary-400" />
                      <span>{username}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={logout}
                    className="btn-secondary text-xs py-1.5 px-3 rounded-xl font-semibold flex items-center gap-1.5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all cursor-pointer group"
                    title="Log Out Session"
                  >
                    <LogOut size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Exit</span>
                  </button>
                </div>
              </nav>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 flex-1 flex flex-col justify-center">
          {!isAuthenticated ? (
            <AuthPage />
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/level/:id" element={<LevelExecution />} />
              <Route path="/quiz/:categoryId" element={<Quiz />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/social" element={<SocialPanel />} />
              
              {/* Guarded Admin Route */}
              <Route 
                path="/admin" 
                element={isAdmin ? <AdminDashboard /> : <AccessDeniedView />} 
              />
            </Routes>
          )}
        </main>
        
      </div>
    </Router>
  );
}

export default App;
