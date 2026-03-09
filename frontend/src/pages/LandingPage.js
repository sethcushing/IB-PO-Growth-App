import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TrendingUp, Eye, EyeOff, Shield, Users, BarChart2 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@company.com', role: 'Admin', description: 'Full access' },
    { email: 'exec@company.com', role: 'ExecViewer', description: 'View dashboards' },
    { email: 'james.chen@company.com', role: 'Manager', description: 'Team view' },
    { email: 'alex.johnson@company.com', role: 'ProductOwner', description: 'Self-assessment' },
    { email: 'lisa.wang@company.com', role: 'AgileCoach', description: 'Coach feedback' }
  ];

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-lime-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-lg space-y-8 relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-lime-600 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/20">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">PO Growth</h1>
              <p className="text-slate-400 text-sm">Development Platform</p>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium">Growth Score</span>
              <span className="px-3 py-1.5 bg-lime-500/20 text-lime-400 text-sm rounded-full font-semibold">
                On Track
              </span>
            </div>
            <div className="text-6xl font-bold text-white tracking-tight">72.4</div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-2xl font-bold text-lime-400">68</div>
                <div className="text-xs text-slate-500 mt-1">Self</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-400">74</div>
                <div className="text-xs text-slate-500 mt-1">Team</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-400">75</div>
                <div className="text-xs text-slate-500 mt-1">Manager</div>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-center text-sm leading-relaxed">
            Track and develop Product Owner capabilities across your organization
          </p>

          <div className="flex justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Shield className="w-4 h-4 text-lime-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Users className="w-4 h-4 text-lime-500" />
              <span>360° Feedback</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <BarChart2 className="w-4 h-4 text-lime-500" />
              <span>Insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 bg-gradient-to-br from-slate-50 via-white to-lime-50/30">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900">PO Growth</span>
              <p className="text-xs text-slate-500">Development Platform</p>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500">Sign in to access your growth dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-12 bg-white/80 backdrop-blur border-slate-200/80 focus:border-lime-400 focus:ring-lime-400/20 transition-all"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 pr-12 bg-white/80 backdrop-blur border-slate-200/80 focus:border-lime-400 focus:ring-lime-400/20 transition-all"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-semibold shadow-lg shadow-lime-500/25 transition-all duration-200"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gradient-to-r from-white via-white to-lime-50/30 px-4 text-slate-400">Demo Accounts</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account.email)}
                  className="glass-card p-3 text-left hover:border-lime-300/50 transition-all flex items-center justify-between group"
                  data-testid={`demo-login-${account.role.toLowerCase()}`}
                >
                  <div>
                    <div className="text-sm font-medium text-slate-700 group-hover:text-lime-700 transition-colors">{account.email}</div>
                    <div className="text-xs text-slate-400">{account.description}</div>
                  </div>
                  <span className={`
                    text-xs px-2.5 py-1 rounded-full font-medium
                    ${account.role === 'Admin' ? 'bg-violet-100/80 text-violet-700' :
                      account.role === 'Manager' ? 'bg-sky-100/80 text-sky-700' :
                      account.role === 'ProductOwner' ? 'bg-lime-100/80 text-lime-700' :
                      account.role === 'ExecViewer' ? 'bg-amber-100/80 text-amber-700' :
                      'bg-slate-100/80 text-slate-700'}
                  `}>
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">
              Password: <code className="bg-slate-100/80 px-1.5 py-0.5 rounded text-slate-600">demo123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
