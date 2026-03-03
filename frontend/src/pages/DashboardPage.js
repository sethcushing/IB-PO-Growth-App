import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { assignmentsAPI, seedDemoData, scorecardsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import MaturityBadge from '@/components/MaturityBadge';
import { 
  ClipboardCheck, 
  ArrowRight, 
  Clock, 
  CheckCircle2,
  BarChart3,
  Users,
  Settings,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, scorecardsRes] = await Promise.all([
        assignmentsAPI.getMy(),
        scorecardsAPI.getAll().catch(() => ({ data: [] }))
      ]);
      setAssignments(assignmentsRes.data);
      setScorecards(scorecardsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoData();
      toast.success('Demo data seeded successfully!', {
        description: `Created ${response.data.data.product_owners} Product Owners with assessments`
      });
      // Re-fetch data after seeding
      fetchData();
    } catch (error) {
      toast.error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const quickActions = [
    { 
      label: 'My Scorecard', 
      icon: BarChart3, 
      path: '/scorecard',
      roles: ['ProductOwner', 'Manager', 'Admin'],
      color: 'bg-lime-100 text-lime-700'
    },
    { 
      label: 'My Team', 
      icon: Users, 
      path: '/manager',
      roles: ['Manager', 'Admin'],
      color: 'bg-sky-100 text-sky-700'
    },
    { 
      label: 'Executive Dashboard', 
      icon: BarChart3, 
      path: '/executive',
      roles: ['ExecViewer', 'Admin'],
      color: 'bg-violet-100 text-violet-700'
    },
    { 
      label: 'Admin Console', 
      icon: Settings, 
      path: '/admin',
      roles: ['Admin'],
      color: 'bg-amber-100 text-amber-700'
    }
  ].filter(action => action.roles.includes(user?.role));

  const pendingAssignments = assignments.filter(a => a.status === 'Pending');
  const completedAssignments = assignments.filter(a => a.status === 'Completed');

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900">
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-600 mt-1">
              {user?.role === 'Admin' && 'Manage assessments and view organization insights'}
              {user?.role === 'ExecViewer' && 'View executive dashboards and organization metrics'}
              {user?.role === 'Manager' && 'Complete assessments and view team scorecards'}
              {user?.role === 'ProductOwner' && 'Complete your self-assessment and view your scorecard'}
              {user?.role === 'BusinessPartner' && 'Complete assessments for assigned Product Owners'}
            </p>
          </div>
          
          {user?.role === 'Admin' && (
            <Button
              onClick={handleSeedDemo}
              disabled={seeding}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="seed-demo-btn"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Seeding...' : 'Seed Demo Data'}
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
                className="glass-card p-6 text-left hover:shadow-md hover:border-lime-200 transition-all duration-200 group"
                data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="font-medium text-slate-900 group-hover:text-lime-700 transition-colors">
                  {action.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pending Assessments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-slate-900">
              Pending Assessments
            </h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {pendingAssignments.length} remaining
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-lime-500 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
                All caught up!
              </h3>
              <p className="text-slate-600">
                You have no pending assessments at this time.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingAssignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="glass-card p-6 hover:shadow-md hover:border-lime-200 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <ClipboardCheck className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {assignment.rater_type} Assessment
                        </h3>
                        <p className="text-sm text-slate-600">
                          {assignment.rater_type === 'Self' 
                            ? 'Complete your self-assessment' 
                            : `Assess ${assignment.po_name}`}
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
                        className="bg-lime-600 hover:bg-lime-700 text-white"
                        data-testid={`start-assessment-${assignment.po_id}`}
                      >
                        Start
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  {assignment.completion_pct > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">{Math.round(assignment.completion_pct)}%</span>
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
            <h2 className="font-heading text-xl font-semibold text-slate-900">
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
                      <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-lime-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {assignment.rater_type} Assessment
                        </h3>
                        <p className="text-sm text-slate-600">
                          {assignment.rater_type === 'Self' 
                            ? 'Self-assessment completed' 
                            : `Assessment for ${assignment.po_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-lime-100 text-lime-700">
                        Completed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assessment/${assignment.cycle_id}/${assignment.po_id}?view=true`)}
                        data-testid={`view-assessment-${assignment.po_id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Scorecards - For Admin/ExecViewer/Manager */}
        {['Admin', 'ExecViewer', 'Manager'].includes(user?.role) && scorecards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold text-slate-900">
                Assessment Results
              </h2>
              <Badge variant="secondary">
                {scorecards.length} scorecards
              </Badge>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Product Owner</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Team</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Self Score</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Partner Avg</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Manager</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Maturity</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scorecards.slice(0, 10).map((sc) => (
                      <tr key={sc.po_id} className="table-row-hover">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{sc.po_name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{sc.po_team}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-lime-700 font-medium">
                            {sc.overall_self?.toFixed(1) || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sky-700 font-medium">
                            {sc.overall_partner_avg?.toFixed(1) || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-violet-700 font-medium">
                            {sc.overall_manager?.toFixed(1) || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <MaturityBadge band={sc.maturity_band} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/scorecard/${sc.po_id}`)}
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
                <div className="p-4 border-t border-slate-100 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/executive')}
                    className="text-lime-700"
                  >
                    View all {scorecards.length} scorecards
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
