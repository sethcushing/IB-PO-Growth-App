import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { assignmentsAPI, seedDemoData, scorecardsAPI, cyclesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import GrowthBadge from '@/components/MaturityBadge';
import { 
  ClipboardCheck, 
  ArrowRight, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  Users,
  Settings,
  RefreshCw,
  Eye,
  FileText,
  Calendar
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchScorecards();
    }
  }, [selectedCycle]);

  const fetchData = async () => {
    try {
      const [assignmentsRes, cyclesRes] = await Promise.all([
        assignmentsAPI.getMy(),
        cyclesAPI.getAll()
      ]);
      setAssignments(assignmentsRes.data);
      setCycles(cyclesRes.data);
      
      const activeCycle = cyclesRes.data.find(c => c.status === 'Active') || cyclesRes.data[0];
      if (activeCycle) {
        setSelectedCycle(activeCycle.id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScorecards = async () => {
    try {
      const scorecardsRes = await scorecardsAPI.getAll({ cycle_id: selectedCycle });
      setScorecards(scorecardsRes.data);
    } catch (error) {
      console.error('Failed to fetch scorecards:', error);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoData();
      toast.success('Demo data loaded!', {
        description: response.data.pending_assessments
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to load demo data');
    } finally {
      setSeeding(false);
    }
  };

  const quickActions = [
    { 
      label: 'My Growth', 
      icon: TrendingUp, 
      path: '/scorecard',
      roles: ['ProductOwner', 'Manager', 'Admin'],
      color: 'bg-gradient-to-br from-lime-400/20 to-lime-500/10 text-lime-700'
    },
    { 
      label: 'My Team', 
      icon: Users, 
      path: '/manager',
      roles: ['Manager', 'Admin'],
      color: 'bg-gradient-to-br from-sky-400/20 to-sky-500/10 text-sky-700'
    },
    { 
      label: 'Organization', 
      icon: TrendingUp, 
      path: '/executive',
      roles: ['ExecViewer', 'Admin'],
      color: 'bg-gradient-to-br from-violet-400/20 to-violet-500/10 text-violet-700'
    },
    { 
      label: 'Admin', 
      icon: Settings, 
      path: '/admin',
      roles: ['Admin'],
      color: 'bg-gradient-to-br from-amber-400/20 to-amber-500/10 text-amber-700'
    }
  ].filter(action => action.roles.includes(user?.role));

  const pendingAssignments = assignments.filter(a => a.status === 'Pending');
  const completedAssignments = assignments.filter(a => a.status === 'Completed');
  const currentCycle = cycles.find(c => c.id === selectedCycle);

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 mt-1">
              {user?.role === 'Admin' && 'Manage assessments and view organization insights'}
              {user?.role === 'ExecViewer' && 'View organization dashboards and growth metrics'}
              {user?.role === 'Manager' && 'Complete assessments and view team progress'}
              {user?.role === 'ProductOwner' && 'Complete your assessment and track your growth'}
              {user?.role === 'AgileCoach' && 'Provide feedback for your Product Owners'}
            </p>
          </div>
          
          {user?.role === 'Admin' && (
            <Button
              onClick={handleSeedDemo}
              disabled={seeding}
              variant="outline"
              className="flex items-center gap-2 glass-card hover:bg-white/90"
              data-testid="seed-demo-btn"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Loading...' : 'Load Demo Data'}
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="glass-card p-6 text-left group"
                data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="font-semibold text-slate-900 group-hover:text-lime-700 transition-colors">
                  {action.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pending Assessments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Pending Assessments
            </h2>
            <Badge className="bg-amber-100/80 text-amber-700 border-0">
              {pendingAssignments.length} remaining
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-4 bg-slate-200/60 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-slate-200/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-16 h-16 bg-lime-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-lime-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                All caught up!
              </h3>
              <p className="text-slate-500">
                You have no pending assessments at this time.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingAssignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-500/10 rounded-xl flex items-center justify-center">
                        <ClipboardCheck className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {assignment.rater_type} Assessment
                        </h3>
                        <p className="text-sm text-slate-500">
                          {assignment.rater_type === 'Self' 
                            ? 'Complete your growth assessment' 
                            : `Provide feedback for ${assignment.po_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm text-slate-500">{assignment.cycle_name}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          ~12 min
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/assessment/${assignment.cycle_id}/${assignment.po_id}`)}
                        className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg shadow-lime-500/20"
                        data-testid={`start-assessment-${assignment.po_id}`}
                      >
                        {assignment.completion_pct > 0 ? 'Continue' : 'Start'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  {assignment.completion_pct > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-semibold text-slate-900">{Math.round(assignment.completion_pct)}%</span>
                      </div>
                      <Progress value={assignment.completion_pct} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Assessments */}
        {completedAssignments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Completed Assessments
            </h2>
            <div className="grid gap-4">
              {completedAssignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-lime-400/20 to-lime-500/10 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-lime-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {assignment.rater_type} Assessment
                        </h3>
                        <p className="text-sm text-slate-500">
                          {assignment.rater_type === 'Self' 
                            ? 'Assessment completed' 
                            : `Feedback for ${assignment.po_name}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{assignment.cycle_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-lime-100/80 text-lime-700 border-0">
                        Completed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assessment/${assignment.cycle_id}/${assignment.po_id}?view=true`)}
                        className="glass-card hover:bg-white/90"
                        data-testid={`view-assessment-${assignment.po_id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Results - For Admin/ExecViewer/Manager */}
        {['Admin', 'ExecViewer', 'Manager'].includes(user?.role) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Growth Results
              </h2>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Select value={selectedCycle || ''} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-48 glass-card" data-testid="cycle-select">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name} {cycle.status === 'Active' && '(Active)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className="bg-slate-100/80 text-slate-600 border-0">
                  {scorecards.length} results
                </Badge>
              </div>
            </div>
            
            {scorecards.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="w-16 h-16 bg-slate-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  No results yet
                </h3>
                <p className="text-slate-500">
                  Results will appear here once assessments are completed.
                </p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Team</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Self</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Team Avg</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Manager</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Level</th>
                        <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {scorecards.slice(0, 10).map((sc) => (
                        <tr key={sc.po_id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">{sc.po_name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{sc.po_team}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-semibold text-lime-700">
                              {sc.overall_self?.toFixed(1) || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-semibold text-sky-700">
                              {sc.overall_partner_avg?.toFixed(1) || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-semibold text-violet-700">
                              {sc.overall_manager?.toFixed(1) || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <GrowthBadge band={sc.maturity_band} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/scorecard/${sc.po_id}`)}
                              className="text-lime-700 hover:text-lime-800 hover:bg-lime-50"
                              data-testid={`view-scorecard-${sc.po_id}`}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {scorecards.length > 10 && (
                  <div className="p-4 border-t border-slate-100/50 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/executive')}
                      className="text-lime-700 hover:text-lime-800"
                    >
                      View all {scorecards.length} results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
