import { useNavigate } from 'react-router-dom';

const HeatmapChart = ({ data }) => {
  const navigate = useNavigate();

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400">
        No data available
      </div>
    );
  }

  const { dimensions, data: poData } = data;

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'bg-slate-100';
    if (score < 25) return 'bg-slate-200';
    if (score < 45) return 'bg-amber-200';
    if (score < 65) return 'bg-lime-200';
    if (score < 85) return 'bg-lime-400';
    return 'bg-lime-600 text-white';
  };

  const getScoreTextColor = (score) => {
    if (score === null || score === undefined) return 'text-slate-400';
    if (score >= 85) return 'text-white';
    return 'text-slate-900';
  };

  return (
    <div className="overflow-x-auto" data-testid="heatmap-chart">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-sm font-medium text-slate-600 sticky left-0 bg-white z-10">
              Product Owner
            </th>
            {dimensions.map((dim) => (
              <th 
                key={dim.id} 
                className="px-2 py-2 text-xs font-medium text-slate-600 text-center whitespace-nowrap"
                style={{ minWidth: '80px' }}
              >
                {dim.name.split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {poData.map((po) => (
            <tr 
              key={po.po_id} 
              className="hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/scorecard/${po.po_id}`)}
            >
              <td className="px-3 py-2 text-sm font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                <div className="truncate max-w-[150px]" title={po.po_name}>
                  {po.po_name}
                </div>
                <div className="text-xs text-slate-500">{po.team}</div>
              </td>
              {dimensions.map((dim) => {
                const score = po.scores[dim.id];
                return (
                  <td 
                    key={dim.id} 
                    className={`px-2 py-2 text-center transition-all ${getScoreColor(score)}`}
                  >
                    <span className={`text-sm font-medium ${getScoreTextColor(score)}`}>
                      {score !== null && score !== undefined ? score.toFixed(0) : '—'}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <span>0-24</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-4 h-4 bg-amber-200 rounded" />
          <span>25-44</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-4 h-4 bg-lime-200 rounded" />
          <span>45-64</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-4 h-4 bg-lime-400 rounded" />
          <span>65-84</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-4 h-4 bg-lime-600 rounded" />
          <span>85-100</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
