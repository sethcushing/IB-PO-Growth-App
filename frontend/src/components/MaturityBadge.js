import { Award } from 'lucide-react';

const bandConfig = {
  Foundational: { 
    class: 'badge-foundational', 
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200' 
  },
  Developing: { 
    class: 'badge-developing', 
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200' 
  },
  Performing: { 
    class: 'badge-performing', 
    bgClass: 'bg-lime-50 text-lime-700 border-lime-200' 
  },
  Leading: { 
    class: 'badge-leading', 
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
  },
  Elite: { 
    class: 'badge-elite', 
    bgClass: 'bg-lime-600 text-white border-lime-700' 
  }
};

const MaturityBadge = ({ band, size = 'md' }) => {
  const config = bandConfig[band] || bandConfig.Foundational;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bgClass} ${sizeClasses[size]}`}
      data-testid={`maturity-badge-${band?.toLowerCase()}`}
    >
      {size !== 'sm' && <Award className="w-3.5 h-3.5" />}
      {band}
    </span>
  );
};

export default MaturityBadge;
