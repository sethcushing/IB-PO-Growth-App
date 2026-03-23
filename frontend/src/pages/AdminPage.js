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
  Download,
  Lightbulb,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Grid3X3
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
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPO, setExpandedPO] = useState(null);

  const handleLogin = () => {
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

  const getHeatmapColor = (score) => {
    if (score === null || score === undefined) return 'bg-slate-100';
    if (score >= 80) return 'bg-lime-500';
    if (score >= 60) return 'bg-lime-300';
    if (score >= 40) return 'bg-amber-300';
    if (score >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const generateAISuggestions = (submission) => {
    const suggestions = [];
    const dimensionScores = submission.dimension_scores || [];
    
    // Find weakest dimensions
    const sortedDims = [...dimensionScores].sort((a, b) => (a.score || 0) - (b.score || 0));
    const weakestDims = sortedDims.slice(0, 3);
    
    // Generate personalized suggestions based on weak areas
    const suggestionTemplates = {
      'Strategy': {
        low: 'Focus on developing a clearer product vision. Consider creating a vision statement workshop and practicing outcome-based roadmapping.',
        medium: 'Good strategic foundation. Enhance by connecting daily work more explicitly to measurable business outcomes.',
        high: 'Strong strategic skills. Consider mentoring others on vision articulation and outcome-driven planning.'
      },
      'Customer': {
        low: 'Prioritize direct customer engagement. Schedule weekly user interviews and implement a systematic feedback collection process.',
        medium: 'Building customer empathy well. Deepen insights by creating customer journey maps and conducting more discovery research.',
        high: 'Excellent customer focus. Share your research methods with the team and establish customer advisory programs.'
      },
      'Backlog': {
        low: 'Implement a consistent prioritization framework (RICE, WSJF). Schedule regular backlog grooming sessions.',
        medium: 'Backlog management is improving. Focus on reducing backlog size and improving story quality.',
        high: 'Well-managed backlog. Consider implementing more sophisticated prioritization models and predictability metrics.'
      },
      'Delivery': {
        low: 'Strengthen collaboration with development teams. Participate in technical discussions and pair with engineers regularly.',
        medium: 'Good delivery partnership. Work on earlier involvement in technical decisions and risk identification.',
        high: 'Strong delivery collaboration. Help establish best practices for PO-engineering partnerships across teams.'
      },
      'Stakeholder Management': {
        low: 'Map your stakeholders and establish regular communication cadences. Practice managing competing priorities.',
        medium: 'Building stakeholder relationships well. Focus on proactive communication and alignment before decisions.',
        high: 'Excellent stakeholder management. Mentor others on influence without authority and conflict resolution.'
      },
      'Execution': {
        low: 'Focus on commitment reliability. Break work into smaller increments and improve estimation practices.',
        medium: 'Execution is solid. Enhance by implementing better progress tracking and early warning systems.',
        high: 'Highly reliable execution. Share your practices for consistent delivery and continuous improvement.'
      },
      'Data': {
        low: 'Define success metrics before starting features. Build habits around data-informed decision making.',
        medium: 'Good data awareness. Implement more rigorous post-launch analysis and A/B testing practices.',
        high: 'Strong data-driven approach. Help establish data culture and analytics best practices team-wide.'
      },
      'Governance': {
        low: 'Document key decisions proactively. Build compliance considerations into your planning process.',
        medium: 'Good governance awareness. Focus on balancing process efficiency with necessary controls.',
        high: 'Excellent governance practices. Help streamline processes while maintaining compliance standards.'
      }
    };

    weakestDims.forEach(dim => {
      const dimName = dim.dimension;
      const score = dim.score || 0;
      const template = suggestionTemplates[dimName];
      
      if (template) {
        let suggestion;
        if (score < 40) {
          suggestion = template.low;
        } else if (score < 70) {
          suggestion = template.medium;
        } else {
          suggestion = template.high;
        }
        
        suggestions.push({
          dimension: dimName,
          score: score,
          suggestion: suggestion,
          priority: score < 40 ? 'high' : score < 60 ? 'medium' : 'low'
        });
      }
    });

    return suggestions;
  };

  const getDimensionAverages = () => {
    if (!submissions.length) return [];
    
    const dimTotals = {};
    const dimCounts = {};
    
    submissions.forEach(sub => {
      (sub.dimension_scores || []).forEach(ds => {
        if (!dimTotals[ds.dimension]) {
          dimTotals[ds.dimension] = 0;
          dimCounts[ds.dimension] = 0;
        }
        if (ds.score !== null && ds.score !== undefined) {
          dimTotals[ds.dimension] += ds.score;
          dimCounts[ds.dimension]++;
        }
      });
    });

    return Object.keys(dimTotals).map(dim => ({
      dimension: dim,
      average: dimCounts[dim] > 0 ? dimTotals[dim] / dimCounts[dim] : 0
    })).sort((a, b) => a.average - b.average);
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

  // View individual submission with AI suggestions
  if (selectedSubmission) {
    const journeyInfo = getJourneyLevel(selectedSubmission.overall_score);
    const aiSuggestions = generateAISuggestions(selectedSubmission);
    
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

          {/* AI Training Suggestions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">AI Training Suggestions</h3>
                <p className="text-sm text-slate-500">Personalized development recommendations</p>
              </div>
            </div>
            <div className="space-y-4">
              {aiSuggestions.map((sug, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${
                  sug.priority === 'high' ? 'bg-red-50 border-red-200' :
                  sug.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className={`w-4 h-4 ${
                        sug.priority === 'high' ? 'text-red-600' :
                        sug.priority === 'medium' ? 'text-amber-600' :
                        'text-green-600'
                      }`} />
                      <span className="font-medium text-slate-900">{sug.dimension}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${
                      sug.priority === 'high' ? 'border-red-300 text-red-700' :
                      sug.priority === 'medium' ? 'border-amber-300 text-amber-700' :
                      'border-green-300 text-green-700'
                    }`}>
                      Score: {sug.score?.toFixed(0)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700">{sug.suggestion}</p>
                </div>
              ))}
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

  const dimensionAverages = getDimensionAverages();
  const dimensions = submissions[0]?.dimension_scores?.map(d => d.dimension) || [];

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
              { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
              { id: 'submissions', label: 'All Submissions', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-lime-600 text-lime-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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

            {/* Dimension Averages - Organization Strengths & Gaps */}
            {dimensionAverages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Top Development Areas</h3>
                  </div>
                  <div className="space-y-3">
                    {dimensionAverages.slice(0, 3).map((dim, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-sm font-medium text-amber-700">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700">{dim.dimension}</span>
                            <span className="text-sm font-mono text-slate-500">{dim.average.toFixed(1)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${dim.average}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-lime-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Organization Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {dimensionAverages.slice(-3).reverse().map((dim, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-lime-100 rounded-full flex items-center justify-center text-sm font-medium text-lime-700">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700">{dim.dimension}</span>
                            <span className="text-sm font-mono text-slate-500">{dim.average.toFixed(1)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-lime-500 rounded-full" style={{ width: `${dim.average}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Grid3X3 className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Skills Heatmap by PO</h3>
            </div>
            
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No submissions to display
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 text-sm font-medium text-slate-600 sticky left-0 bg-white">Name</th>
                      {dimensions.map(dim => (
                        <th key={dim} className="px-2 py-2 text-xs font-medium text-slate-600 text-center min-w-[80px]">
                          {dim}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-sm font-medium text-slate-600 text-center">Overall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 sticky left-0 bg-white">
                          <span className="font-medium text-slate-900 text-sm">{sub.participant_name}</span>
                        </td>
                        {dimensions.map(dim => {
                          const dimScore = sub.dimension_scores?.find(d => d.dimension === dim);
                          const score = dimScore?.score;
                          return (
                            <td key={dim} className="px-2 py-2">
                              <div 
                                className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${getHeatmapColor(score)} ${score >= 60 ? 'text-white' : 'text-slate-700'}`}
                                title={`${dim}: ${score?.toFixed(0) || 'N/A'}`}
                              >
                                {score?.toFixed(0) || '—'}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getHeatmapColor(sub.overall_score)} ${sub.overall_score >= 60 ? 'text-white' : 'text-slate-700'}`}>
                            {sub.overall_score?.toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 justify-center">
              <span className="text-xs text-slate-500">Score Legend:</span>
              <div className="flex gap-2">
                {[
                  { color: 'bg-red-400', label: '0-20' },
                  { color: 'bg-orange-400', label: '20-40' },
                  { color: 'bg-amber-300', label: '40-60' },
                  { color: 'bg-lime-300', label: '60-80' },
                  { color: 'bg-lime-500', label: '80-100' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="text-xs text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">AI Training Suggestions by PO</h3>
                  <p className="text-sm text-slate-500">Click on a PO to see personalized development recommendations</p>
                </div>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => {
                  const journeyInfo = getJourneyLevel(sub.overall_score);
                  const aiSuggestions = generateAISuggestions(sub);
                  const isExpanded = expandedPO === sub.id;
                  
                  return (
                    <div key={sub.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedPO(isExpanded ? null : sub.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {sub.participant_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-slate-900">{sub.participant_name}</div>
                            <div className="text-sm text-slate-500">
                              Score: {sub.overall_score?.toFixed(1)} • {new Date(sub.submitted_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${journeyInfo.color}`}>
                            {journeyInfo.level}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-slate-100">
                          <div className="pt-4 space-y-4">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Recommended Training Focus Areas
                            </h4>
                            {aiSuggestions.map((sug, idx) => (
                              <div key={idx} className={`p-4 rounded-lg border ${
                                sug.priority === 'high' ? 'bg-red-50 border-red-200' :
                                sug.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                                'bg-green-50 border-green-200'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Target className={`w-4 h-4 ${
                                      sug.priority === 'high' ? 'text-red-600' :
                                      sug.priority === 'medium' ? 'text-amber-600' :
                                      'text-green-600'
                                    }`} />
                                    <span className="font-medium text-slate-900">{sug.dimension}</span>
                                  </div>
                                  <Badge variant="outline" className={`text-xs ${
                                    sug.priority === 'high' ? 'border-red-300 text-red-700' :
                                    sug.priority === 'medium' ? 'border-amber-300 text-amber-700' :
                                    'border-green-300 text-green-700'
                                  }`}>
                                    {sug.priority === 'high' ? 'Priority' : sug.priority === 'medium' ? 'Recommended' : 'Enhance'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700">{sug.suggestion}</p>
                              </div>
                            ))}
                            <Button
                              onClick={() => setSelectedSubmission(sub)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
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
        )}
      </main>
    </div>
  );
};

export default AdminPage;
