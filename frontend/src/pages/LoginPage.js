import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BarChart3, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    { email: 'admin@company.com', role: 'Admin' },
    { email: 'exec@company.com', role: 'ExecViewer' },
    { email: 'james.chen@company.com', role: 'Manager' },
    { email: 'alex.johnson@company.com', role: 'ProductOwner' },
    { email: 'lisa.wang@company.com', role: 'BusinessPartner' }
  ];

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-lime-50/30 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Back Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            data-testid="back-to-home-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-lime-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-semibold text-2xl text-slate-900">APO Assessment</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600">Sign in to access your assessments and scorecards</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-12"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 pr-12"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-medium"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Accounts Toggle */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">Demo Accounts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account.email)}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-lime-300 hover:bg-lime-50/50 transition-colors"
                  data-testid={`demo-login-${account.role.toLowerCase()}`}
                >
                  <div className="text-xs text-slate-500">{account.role}</div>
                  <div className="text-sm font-medium text-slate-700 truncate">{account.email}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center">
              All demo accounts use password: <code className="bg-slate-100 px-1.5 py-0.5 rounded">demo123</code>
            </p>
          </div>

          {/* Register Link */}
          <p className="text-center text-slate-600">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-lime-600 hover:text-lime-700 font-medium"
              data-testid="register-link"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-lg space-y-8">
          <div className="glass-panel bg-slate-800/50 p-8 border-slate-700">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Overall Maturity Score</span>
                <span className="px-3 py-1 bg-lime-600 text-white text-sm rounded-full font-medium">Leading</span>
              </div>
              <div className="text-6xl font-heading font-bold text-white">72.4</div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <div className="text-2xl font-heading font-semibold text-lime-400">68</div>
                  <div className="text-xs text-slate-500">Self</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-semibold text-sky-400">74</div>
                  <div className="text-xs text-slate-500">Partner</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-semibold text-violet-400">75</div>
                  <div className="text-xs text-slate-500">Manager</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-center">
            Gain actionable insights into PO capabilities across your organization
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
