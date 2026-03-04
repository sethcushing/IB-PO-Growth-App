import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scorecardsAPI, dimensionsAPI, cyclesAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import RadarChart from '@/components/charts/RadarChart';
import DeltaChip from '@/components/DeltaChip';
import MaturityBadge from '@/components/MaturityBadge';
import {
  TrendingUp,
  Users,
  User,
  Briefcase,
  AlertTriangle,
  Info,
  Calendar,
  ClipboardCheck,
  ArrowRight
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ScorecardPage = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  const [scorecard, setScorecard] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [poId]);

  const fetchInitialData = async () => {
    try {
      const cyclesRes = await cyclesAPI.getAll();
      setCycles(cyclesRes.data);
      
      // Fetch scorecard (will auto-fallback to historical if needed)
      let scorecardRes;
      if (poId) {
        scorecardRes = await scorecardsAPI.get(poId);
      } else {
        scorecardRes = await scorecardsAPI.getMy();
      }
      
      const data = scorecardRes.data;
      
      if (data._fallback_from_cycle) {
        setFallbackMessage(`Showing data from ${data._fallback_from_cycle} (no data in current cycle)`);
        setSelectedCycle(data.cycle_id);
      } else if (data._no_data || data.overall_self === null) {
        // No data at all
        setSelectedCycle(cyclesRes.data.find(c => c.status === 'Active')?.id || cyclesRes.data[0]?.id);
      } else {
        setSelectedCycle(data.cycle_id);
      }
      
      setScorecard(data);
    } catch (error) {
      console.error('Failed to fetch scorecard:', error);
      toast.error('Failed to load scorecard');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleChange = async (cycleId) => {
    setSelectedCycle(cycleId);
    setLoading(true);
    setFallbackMessage(null);
    
    try {
      // Fetch scorecard for specific cycle
      const allScorecards = await scorecardsAPI.getAll({ cycle_id: cycleId });
      
      let targetScorecard;
      if (poId) {
        targetScorecard = allScorecards.data.find(s => s.po_id === poId);
      } else {
        // For "my scorecard", find the one belonging to current user
        const myScorecard = await scorecardsAPI.getMy();
        const myPoId = myScorecard.data?.po_id;
        targetScorecard = allScorecards.data.find(s => s.po_id === myPoId);
      }
      
      if (targetScorecard) {
        setScorecard(targetScorecard);
      } else {
        setScorecard({ ...scorecard, overall_self: null, _no_data: true });
      }
    } catch (error) {
      console.error('Failed to fetch scorecard for cycle:', error);
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

  const currentCycle = cycles.find(c => c.id === selectedCycle);
  const hasData = scorecard && scorecard.overall_self !== null && !scorecard._no_data;

  // No data view
  if (!hasData) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          {/* Header with Cycle Selector */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900">
                {poId ? scorecard?.po_name || 'PO' : 'My'} Scorecard
              </h1>
              <p className="text-slate-600 mt-1">{scorecard?.po_team || ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Select value={selectedCycle || ''} onValueChange={handleCycleChange}>
                <SelectTrigger className="w-56" data-testid="cycle-select">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} {cycle.status === 'Active' && '(Active)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardCheck className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-semibold text-slate-900 mb-3">
              No Assessment Data
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              {currentCycle?.status === 'Active' 
                ? 'Complete your self-assessment for this cycle to view your scorecard.'
                : 'No assessment data found for this cycle.'}
            </p>
            
            {currentCycle?.status === 'Active' && (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-lime-600 hover:bg-lime-700 text-white mb-6"
              >
                Go to Assessments
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {/* Other cycles with data */}
            {cycles.filter(c => c.id !== selectedCycle).length > 0 && (
              <div className="border-t border-slate-200 pt-6 mt-6">
                <p className="text-sm text-slate-500 mb-3">
                  View historical results:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {cycles.filter(c => c.id !== selectedCycle).map(cycle => (
                    <button
                      key={cycle.id}
                      onClick={() => handleCycleChange(cycle.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-lime-100 text-slate-700 hover:text-lime-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {cycle.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Has data view
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
          <div className="flex flex-wrap items-center gap-3">
            {/* Cycle Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Select value={selectedCycle || ''} onValueChange={handleCycleChange}>
                <SelectTrigger className="w-48" data-testid="cycle-select">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} {cycle.status === 'Active' && '(Active)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <MaturityBadge band={scorecard.maturity_band} />
            {scorecard.flags?.slice(0, 2).map((flag, i) => (
              <Badge key={i} variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {flag.split(':')[0]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Fallback/Info Banner */}
        {fallbackMessage && (
          <div className="flex items-center gap-3 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <Info className="w-5 h-5 text-sky-600" />
            <p className="text-sm text-sky-800">{fallbackMessage}</p>
          </div>
        )}

        {currentCycle && currentCycle.status === 'Closed' && !fallbackMessage && (
          <div className="flex items-center gap-3 p-4 bg-slate-100 border border-slate-200 rounded-lg">
            <Info className="w-5 h-5 text-slate-500" />
            <p className="text-sm text-slate-600">
              Viewing historical data from <strong>{currentCycle.name}</strong>
            </p>
          </div>
        )}

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
