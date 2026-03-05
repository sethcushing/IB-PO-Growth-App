import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Home, 
  ClipboardCheck, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { 
      label: 'Dashboard', 
      icon: Home, 
      path: '/dashboard',
      roles: ['ProductOwner', 'BusinessPartner', 'Manager', 'ExecViewer', 'Admin']
    },
    { 
      label: 'My Growth', 
      icon: ClipboardCheck, 
      path: '/scorecard',
      roles: ['ProductOwner']
    },
    { 
      label: 'My Team', 
      icon: Users, 
      path: '/manager',
      roles: ['Manager', 'Admin']
    },
    { 
      label: 'Organization', 
      icon: TrendingUp, 
      path: '/executive',
      roles: ['ExecViewer', 'Admin']
    },
    { 
      label: 'Admin', 
      icon: Settings, 
      path: '/admin',
      roles: ['Admin']
    }
  ].filter(item => item.roles.includes(user?.role));

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">PO Growth</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100/80 transition-colors"
            data-testid="mobile-menu-btn"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 bottom-0 w-64 sidebar-glass border-r border-slate-200/50 z-40
          transform transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900">PO Growth</span>
                <p className="text-xs text-slate-500">Development Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-lime-100/80 text-lime-700 font-semibold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'}
                `}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive(item.path) && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200/50">
            <div className="glass-card p-4 mb-3">
              <div className="font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-sm text-slate-500 truncate">{user?.email}</div>
              <div className="mt-2">
                <span className={`
                  text-xs px-2.5 py-1 rounded-full font-medium
                  ${user?.role === 'Admin' ? 'bg-violet-100/80 text-violet-700' :
                    user?.role === 'Manager' ? 'bg-sky-100/80 text-sky-700' :
                    user?.role === 'ProductOwner' ? 'bg-lime-100/80 text-lime-700' :
                    user?.role === 'ExecViewer' ? 'bg-amber-100/80 text-amber-700' :
                    'bg-slate-100/80 text-slate-700'}
                `}>
                  {user?.role}
                </span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50/80 transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
