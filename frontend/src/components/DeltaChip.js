import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DeltaChip = ({ value, showLabel = false }) => {
  if (value === null || value === undefined) {
    return <span className="text-slate-400">—</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const chipClass = isPositive 
    ? 'delta-chip positive' 
    : isNegative 
    ? 'delta-chip negative' 
    : 'delta-chip neutral';

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span className={chipClass} data-testid="delta-chip">
      <Icon className="w-3 h-3" />
      <span>{isPositive ? '+' : ''}{value.toFixed(1)}</span>
      {showLabel && (
        <span className="ml-1 text-xs opacity-75">
          {isPositive ? 'overrate' : isNegative ? 'underrate' : 'aligned'}
        </span>
      )}
    </span>
  );
};

export default DeltaChip;
