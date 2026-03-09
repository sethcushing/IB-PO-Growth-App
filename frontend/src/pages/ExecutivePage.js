import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { executiveAPI, exportAPI, cyclesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import RadarChart from '@/components/charts/RadarChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import ScatterChart from '@/components/charts/ScatterChart';
import GrowthBadge from '@/components/MaturityBadge';
import {
  Download,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

const ExecutivePage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchData();
    }
  }, [selectedCycle, selectedTeam]);

  const fetchCycles = async () => {
    try {
      const cyclesRes = await cyclesAPI.getAll();
      setCycles(cyclesRes.data);
      if (cyclesRes.data.length > 0) {
        setSelectedCycle(cyclesRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
    }
  };

  const fetchData = async () => {
    try {
      const params = { cycle_id: selectedCycle };
      if (selectedTeam !== 'all') {
        params.team = selectedTeam;
      }

      const [summaryRes, heatmapRes] = await Promise.all([
        executiveAPI.getSummary(params),
        executiveAPI.getHeatmap(selectedCycle)
      ]);

      setSummary(summaryRes.data);
      setHeatmapData(heatmapRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportAPI.csv(selectedCycle);
      const { headers, rows } = response.data;
      
      // Build CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apo-assessment-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Export complete');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-500">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  const radarData = summary?.dimension_averages?.map(d => ({
    dimension: d.dimension_name.split(' ')[0],
    self: d.avg_self || 0,
    partner: d.avg_partner || 0,
    manager: d.avg_manager || 0
  })) || [];

  const scatterData = summary?.scorecards?.map(s => ({
    name: s.po_name,
    self: s.overall_self || 0,
    partner: s.overall_partner_avg || 0,
    manager: s.overall_manager || 0
  })) || [];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900">Executive Dashboard</h1>
            <p className="text-slate-600 mt-1">Organization-wide assessment insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-40" data-testid="team-filter">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {summary?.teams?.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="export-csv-btn"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-lime-600" />
              <span className="text-sm text-slate-500">Org Avg (Self)</span>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900">
              {summary?.avg_self?.toFixed(1) || '—'}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span className="text-sm text-slate-500">Coach Avg</span>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900">
              {summary?.avg_partner?.toFixed(1) || '—'}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-violet-600" />
              <span className="text-sm text-slate-500">Manager Avg</span>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900">
              {summary?.avg_manager?.toFixed(1) || '—'}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-slate-500">Alignment Index</span>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900">
              {summary?.avg_alignment?.toFixed(0) || '—'}%
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-500">Total POs</span>
            </div>
            <div className="text-3xl font-heading font-bold text-slate-900">
              {summary?.total_pos || 0}
            </div>
          </div>
        </div>

        {/* Growth Distribution */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-slate-900 mb-6">
            Growth Level Distribution
          </h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(summary?.maturity_distribution || {}).map(([band, count]) => (
              <div key={band} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <GrowthBadge band={band} />
                <div>
                  <div className="text-2xl font-heading font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-500">POs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="glass-card p-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-6">
              Dimension Averages
            </h2>
            <div className="h-80">
              <RadarChart data={radarData} />
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-lime-500" />
                <span className="text-sm text-slate-600">Self</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-sm text-slate-600">Coach</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-sm text-slate-600">Manager</span>
              </div>
            </div>
          </div>

          {/* Scatter Plot */}
          <div className="glass-card p-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-6">
              Perception Delta (Self vs Coach)
            </h2>
            <div className="h-80">
              <ScatterChart data={scatterData} />
            </div>
            <p className="text-sm text-slate-500 text-center mt-4">
              Points above the line: Self &gt; Coach perception
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-lg font-semibold text-slate-900 mb-6">
            Growth Heatmap
          </h2>
          {heatmapData && <HeatmapChart data={heatmapData} />}
        </div>

        {/* Insights Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Strengths */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-lime-600" />
              <h2 className="font-heading text-lg font-semibold text-slate-900">
                Top Strengths
              </h2>
            </div>
            <div className="space-y-3">
              {summary?.top_strengths?.map((dim, i) => (
                <div key={dim.dimension_id} className="flex items-center justify-between p-3 bg-lime-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-lime-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-900">{dim.dimension_name}</span>
                  </div>
                  <span className="text-lg font-heading font-bold text-lime-700">
                    {dim.avg_self?.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Gaps */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="font-heading text-lg font-semibold text-slate-900">
                Improvement Areas
              </h2>
            </div>
            <div className="space-y-3">
              {summary?.top_gaps?.map((dim, i) => (
                <div key={dim.dimension_id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-900">{dim.dimension_name}</span>
                  </div>
                  <span className="text-lg font-heading font-bold text-amber-700">
                    {dim.avg_self?.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PO List */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-slate-900">All Product Owners</h2>
            <Badge variant="secondary">{summary?.total_pos} total</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Team</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Self</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Coach</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Manager</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Alignment</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Growth</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.scorecards?.map((sc) => (
                  <tr key={sc.po_id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{sc.po_name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{sc.po_team}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-lime-700">{sc.overall_self?.toFixed(1) || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sky-700">{sc.overall_partner_avg?.toFixed(1) || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-violet-700">{sc.overall_manager?.toFixed(1) || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono">{sc.alignment_index?.toFixed(0) || '—'}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <GrowthBadge band={sc.maturity_band} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/scorecard/${sc.po_id}`)}
                        data-testid={`view-po-${sc.po_id}`}
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
        </div>
      </div>
    </Layout>
  );
};

export default ExecutivePage;
