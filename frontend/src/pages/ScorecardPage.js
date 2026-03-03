import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { scorecardsAPI, dimensionsAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import RadarChart from '@/components/charts/RadarChart';
import DeltaChip from '@/components/DeltaChip';
import MaturityBadge from '@/components/MaturityBadge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  User,
  Briefcase,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ScorecardPage = () => {
  const { poId } = useParams();
  const [scorecard, setScorecard] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [poId]);

  const fetchData = async () => {
    try {
      const [scorecardRes, dimensionsRes] = await Promise.all([
        poId ? scorecardsAPI.get(poId) : scorecardsAPI.getMy(),
        dimensionsAPI.getAll()
      ]);
      setScorecard(scorecardRes.data);
      setDimensions(dimensionsRes.data);
    } catch (error) {
      toast.error('Failed to load scorecard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-500">Loading scorecard...</div>
        </div>
      </Layout>
    );
  }

  if (!scorecard) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-slate-900 mb-2">
            No Scorecard Available
          </h2>
          <p className="text-slate-600">
            Complete your assessment to view your scorecard.
          </p>
        </div>
      </Layout>
    );
  }

  const radarData = scorecard.dimension_scores?.map(ds => ({
    dimension: ds.dimension_name.split(' ')[0],
    self: ds.self_score || 0,
    partner: ds.partner_avg_score || 0,
    manager: ds.manager_score || 0
  })) || [];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900">
              {poId ? scorecard.po_name : 'My'} Scorecard
            </h1>
            <p className="text-slate-600 mt-1">{scorecard.po_team}</p>
          </div>
          <div className="flex items-center gap-3">
            <MaturityBadge band={scorecard.maturity_band} />
            {scorecard.flags?.map((flag, i) => (
              <Badge key={i} variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {flag}
              </Badge>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-lime-600" />
              </div>
              <span className="text-sm text-slate-500">Overall Score</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {scorecard.overall_self?.toFixed(1) || '—'}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-sm text-slate-500">Partner Avg</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {scorecard.overall_partner_avg?.toFixed(1) || '—'}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-sm text-slate-500">Manager</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {scorecard.overall_manager?.toFixed(1) || '—'}
            </div>
          </div>

          <div className="glass-card p-6 kpi-tile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">Alignment</span>
            </div>
            <div className="text-4xl font-heading font-bold text-slate-900">
              {scorecard.alignment_index?.toFixed(0) || '—'}%
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-6">
              Dimension Breakdown
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
                <span className="text-sm text-slate-600">Partner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-sm text-slate-600">Manager</span>
              </div>
            </div>
          </div>

          {/* Score Legend */}
          <div className="glass-card p-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-6">
              Score Summary
            </h2>
            <div className="space-y-4">
              {scorecard.dimension_scores?.map((ds) => (
                <div key={ds.dimension_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{ds.dimension_name}</div>
                    <div className="text-xs text-slate-500">Weight: {ds.weight}%</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-lime-600" />
                            <span className="font-mono text-sm">{ds.self_score?.toFixed(0) || '—'}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Self Score</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-sky-600" />
                            <span className="font-mono text-sm">{ds.partner_avg_score?.toFixed(0) || '—'}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Partner Average</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DeltaChip value={ds.delta_self_partner} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension Details */}
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            Dimension Details
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {scorecard.dimension_scores?.map((ds) => (
              <div key={ds.dimension_id} className="glass-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-slate-900">
                      {ds.dimension_name}
                    </h3>
                    <span className="text-xs text-slate-500">Weight: {ds.weight}%</span>
                  </div>
                  <DeltaChip value={ds.delta_self_partner} showLabel />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-2xl font-heading font-bold text-lime-600">
                      {ds.self_score?.toFixed(0) || '—'}
                    </div>
                    <div className="text-xs text-slate-500">Self</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-heading font-bold text-sky-600">
                      {ds.partner_avg_score?.toFixed(0) || '—'}
                    </div>
                    <div className="text-xs text-slate-500">Partner</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-heading font-bold text-violet-600">
                      {ds.manager_score?.toFixed(0) || '—'}
                    </div>
                    <div className="text-xs text-slate-500">Manager</div>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-lime-500 rounded-full transition-all duration-500"
                      style={{ width: `${ds.self_score || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence & Raters */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-slate-900">Assessment Confidence</h3>
              <p className="text-sm text-slate-600">
                Based on {scorecard.partner_count} partner rater(s)
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-heading font-bold text-slate-900">
                {scorecard.confidence_score}%
              </div>
              <div className="text-xs text-slate-500">
                {scorecard.confidence_score >= 70 ? 'High confidence' : 'Low confidence'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScorecardPage;
