import { useState, type FormEvent } from 'react';
import { ShoppingCart, User, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { writeSession } from '../hooks/useSession';

export const AuthPage = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    writeSession(username.trim());
    setTimeout(() => {
      setIsLoading(false);
      navigate('/pos');
    }, 300);
  };

  const handleQuickRole = (roleUsername: string) => {
    setUsername(roleUsername);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white text-2xl mx-auto flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SUPERMARKET POS SYSTEM</h2>
          <p className="text-xs text-slate-500">Sign in to access cashier register & stock control</p>
        </div>

        {/* Quick Role Selectors */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase text-slate-400 text-center">
            Demo Quick Login Roles
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickRole('admin')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                username.toLowerCase() === 'admin'
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs ring-1 ring-blue-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin (All Access)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('cashier')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                username.toLowerCase() === 'cashier'
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs ring-1 ring-blue-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Cashier</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Username / Cashier ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or cashier1"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>SIGN IN & ENTER POS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Supermarket Point of Sale & Stock Control Platform
          </p>
        </div>
      </div>
    </div>
  );
};

