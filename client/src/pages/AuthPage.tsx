import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User, Mail, Lock, Sparkles, Terminal, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { login } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    setError(null);
    if (val.length === 0) setUsernameValid(null);
    else setUsernameValid(val.length >= 3);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setError(null);
    if (val.length === 0) setEmailValid(null);
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(val));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setError(null);
    if (val.length === 0) setPasswordValid(null);
    else setPasswordValid(val.length >= 6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation check
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!isLogin && !email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin 
        ? 'http://localhost:5000/api/auth/login' 
        : 'http://localhost:5000/api/auth/signup';

      const payload = isLogin 
        ? { usernameOrEmail: username, password } 
        : { username, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // Success: login using token
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = (mode: boolean) => {
    setIsLogin(mode);
    setError(null);
    setPassword('');
    // Keep validation clear
    setUsernameValid(null);
    setEmailValid(null);
    setPasswordValid(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative px-4 overflow-hidden py-10">
      {/* Dynamic Cosmic Background Lights */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        
        {/* Glowing Top Branding */}
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <div className="p-3 bg-dark-800/80 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(138,43,226,0.3)] mb-4 inline-flex items-center justify-center animate-bounce">
            <Terminal className="text-accent-400 w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-primary-gradient mb-2">
            LOGIC ANALYTIC CORE
          </h2>
          <p className="text-gray-400 text-sm max-w-xs">
            Unlock your potential. Verify credentials to initialize system environment.
          </p>
        </div>

        {/* Auth Box */}
        <div className="glass-card p-8 md:p-10 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Subtle gradient bar at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-gradient"></div>

          {/* Toggle pill-switch */}
          <div className="relative flex bg-dark-900 border border-white/5 p-1 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => handleModeToggle(true)}
              className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-500 relative z-10 ${
                isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle(false)}
              className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-500 relative z-10 ${
                !isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Register Account
            </button>
            
            {/* Sliding Pill Background */}
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-primary-gradient rounded-lg transition-transform duration-500 ease-out shadow-[0_0_15px_rgba(106,13,173,0.4)] ${
                isLogin ? 'transform translate-x-0' : 'transform translate-x-full'
              }`}
            ></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username/Email Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">
                {isLogin ? 'Username or Email' : 'Username'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder={isLogin ? 'Enter username or email' : 'Pick a cool username'}
                  className={`w-full bg-dark-900/60 border rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    usernameValid === true
                      ? 'border-green-500/40 focus:ring-green-500/20'
                      : usernameValid === false
                      ? 'border-red-500/40 focus:ring-red-500/20'
                      : 'border-white/10 focus:border-primary-400/80 focus:ring-primary-400/20'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Input (Sign Up Only) */}
            {!isLogin && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@example.com"
                    className={`w-full bg-dark-900/60 border rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      emailValid === true
                        ? 'border-green-500/40 focus:ring-green-500/20'
                        : emailValid === false
                        ? 'border-red-500/40 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-primary-400/80 focus:ring-primary-400/20'
                    }`}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block">
                  Password
                </label>
                {isLogin && (
                  <span className="text-xs text-primary-400 hover:text-accent-400 cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`w-full bg-dark-900/60 border rounded-xl pl-10 pr-10 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    passwordValid === true
                      ? 'border-green-500/40 focus:ring-green-500/20'
                      : passwordValid === false
                      ? 'border-red-500/40 focus:ring-red-500/20'
                      : 'border-white/10 focus:border-primary-400/80 focus:ring-primary-400/20'
                  }`}
                  disabled={loading}
                />
                
                {/* Password visibility eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <span className="text-[10px] text-gray-500 block">
                  Password should be at least 6 characters with letters and numbers.
                </span>
              )}
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 text-sm text-red-300 animate-shake">
                <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-200">Terminal Exception</h4>
                  <p className="text-xs text-red-300/85 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Access Interface' : 'Establish Account'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

          </form>

          {/* Footnotes */}
          <div className="mt-8 text-center border-t border-white/5 pt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Sparkles size={12} className="text-accent-400" />
            <span>Secure connection established using 256-bit JWT authentication tokens.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
