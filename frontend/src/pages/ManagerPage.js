import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import MaturityBadge from '@/components/MaturityBadge';
import {
  Users,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

const ManagerPage = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await managerAPI.getTeam();
      setTeam(response.data);
    } catch (error) {
      toast.error('Failed to load team data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (pct) => {
    if (pct >= 100) return 'text-lime-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-500">Loading team...</div>
        </div>
      </Layout>
    );
  }

  // Calculate team stats
  const avgScore = team.length > 0 
    ? team.reduce((sum, po) => sum + (po.overall_score || 0), 0) / team.filter(po => po.overall_score).length 
    : 0;
  const avgAlignment = team.length > 0
    ? team.reduce((sum, po) => sum + (po.alignment_index || 0), 0) / team.filter(po => po.alignment_index).length
    : 0;
  const completedCount = team.filter(po => po.completion_pct >= 100).length;

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">My Team</h1>
          <p className="text-slate-600 mt-1">View and manage your team's assessment progress</p>
        </div>

        {/* Team KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-sm text-slate-500">Team Size</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {team.length}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-lime-600" />
              </div>
              <span className="text-sm text-slate-500">Avg Score</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {avgScore.toFixed(1)}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">Completed</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {completedCount}/{team.length}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-sm text-slate-500">Avg Alignment</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {avgAlignment.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Team Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Team Members</h2>
          </div>
          
          {team.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No team members assigned</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Level</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Completion</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Score</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Maturity</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Biggest Gap</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Flags</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.map((member) => (
                    <tr 
                      key={member.po_id} 
                      className="table-row-hover"
                      data-testid={`team-row-${member.po_id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{member.po_name}</div>
                        <div className="text-sm text-slate-500">{member.team}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                          {member.role_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-lime-500 h-2 rounded-full"
                              style={{ width: `${member.completion_pct}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getCompletionColor(member.completion_pct)}`}>
                            {member.completion_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-heading font-semibold text-slate-900">
                          {member.overall_score?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.maturity_band ? (
                          <MaturityBadge band={member.maturity_band} size="sm" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {member.biggest_gap ? (
                          <span className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            {member.biggest_gap}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {member.flags?.slice(0, 2).map((flag, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="border-amber-300 text-amber-700 bg-amber-50 text-xs"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {flag.split(':')[0]}
                            </Badge>
                          ))}
                          {(!member.flags || member.flags.length === 0) && (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/scorecard/${member.po_id}`)}
                          className="bg-lime-600 hover:bg-lime-700 text-white"
                          data-testid={`view-scorecard-${member.po_id}`}
                        >
                          View
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManagerPage;
