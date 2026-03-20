import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  ArrowLeft,
  Lock,
  Eye,
  Download
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const handleLogin = () => {
    // Simple password check - in production, use proper auth
    if (password === 'InfoBlox2026!') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      toast.error('Invalid password');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [submissionsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/submissions`),
        fetch(`${API_URL}/api/admin/stats`)
      ]);

      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getJourneyLevel = (score) => {
    if (score >= 85) return { level: 'Elite', color: 'bg-lime-600 text-white' };
    if (score >= 65) return { level: 'Leading', color: 'bg-emerald-100 text-emerald-700' };
    if (score >= 45) return { level: 'Performing', color: 'bg-lime-100 text-lime-700' };
    if (score >= 25) return { level: 'Developing', color: 'bg-amber-100 text-amber-700' };
    return { level: 'Foundational', color: 'bg-slate-100 text-slate-700' };
  };

  const exportCSV = () => {
    if (submissions.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Name', 'Date', 'Overall Score', 'Journey Level', ...submissions[0]?.dimension_scores?.map(d => d.dimension) || []];
    const rows = submissions.map(s => [
      s.participant_name,
      new Date(s.submitted_at).toLocaleDateString(),
      s.overall_score?.toFixed(1),
      getJourneyLevel(s.overall_score).level,
      ...(s.dimension_scores?.map(d => d.score?.toFixed(1)) || [])
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `po-journey-questionnaire-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
            <p className="text-slate-500 mt-1">Enter password to view analytics</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="h-12"
              data-testid="admin-password-input"
            />
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="admin-login-btn"
            >
              Access Dashboard
            </Button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Questionnaire
          </button>
        </div>
      </div>
    );
  }

  // View individual submission
  if (selectedSubmission) {
    const journeyInfo = getJourneyLevel(selectedSubmission.overall_score);
    
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{selectedSubmission.participant_name}</h1>
                <p className="text-sm text-slate-500">
                  Submitted {new Date(selectedSubmission.submitted_at).toLocaleString()}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${journeyInfo.color}`}>
              {journeyInfo.level}
            </span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Overall Journey Score</div>
                <div className="text-4xl font-bold text-lime-600">
                  {selectedSubmission.overall_score?.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dimension Breakdown</h3>
            <div className="space-y-4">
              {selectedSubmission.dimension_scores?.map((ds, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium text-slate-700">{ds.dimension}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-lime-500 rounded-full"
                      style={{ width: `${ds.score}%` }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono text-sm text-slate-600">
                    {ds.score?.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Responses */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">All Responses</h3>
            <div className="space-y-4">
              {selectedSubmission.responses?.map((r, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-slate-700 flex-1">{r.question_text}</p>
                    <Badge variant="outline" className="font-mono">
                      {r.score}/5
                    </Badge>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-slate-500 italic">"{r.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Questionnaire Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={exportCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-lime-600" />
                </div>
                <span className="text-sm text-slate-500">Total Submissions</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.total_submissions}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-lime-600" />
                </div>
                <span className="text-sm text-slate-500">Average Score</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.average_score?.toFixed(1) || '—'}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-lime-600" />
                </div>
                <span className="text-sm text-slate-500">Highest Score</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.highest_score?.toFixed(1) || '—'}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-lime-600" />
                </div>
                <span className="text-sm text-slate-500">This Week</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.submissions_this_week || 0}</div>
            </div>
          </div>
        )}

        {/* Journey Level Distribution */}
        {stats?.level_distribution && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Journey Level Distribution</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.level_distribution).map(([level, count]) => {
                const info = getJourneyLevel(level === 'Elite' ? 90 : level === 'Leading' ? 70 : level === 'Performing' ? 50 : level === 'Developing' ? 30 : 10);
                return (
                  <div key={level} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${info.color}`}>
                      {level}
                    </span>
                    <span className="text-2xl font-bold text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">All Submissions</h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No submissions yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Score</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Level</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const journeyInfo = getJourneyLevel(sub.overall_score);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{sub.participant_name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-lime-600 font-medium">
                          {sub.overall_score?.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${journeyInfo.color}`}>
                          {journeyInfo.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => setSelectedSubmission(sub)}
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
