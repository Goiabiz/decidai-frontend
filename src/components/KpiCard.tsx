import { ArrowUpRight, Info } from 'lucide-react';
import type { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  trend,
  tone = 'green',
  tooltip,
  icon,
  onClick
}: {
  label: string;
  value: string | number;
  trend?: string;
  tone?: string;
  tooltip?: string;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      {tooltip && (
        <button
          className="kpi-card-info"
          type="button"
          aria-label={`Sobre ${label}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Info size={15} />
          <span>{tooltip}</span>
        </button>
      )}

      <div className={`kpi-icon tone-${tone}`}>{icon ?? <ArrowUpRight size={20} />}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {trend && <small className={`trend tone-text-${tone}`}>{trend} vs ontem</small>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <div className="kpi-card kpi-card-clickable" role="button" tabIndex={0} onClick={onClick} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } }}>
        {content}
      </div>
    );
  }

  return <div className="kpi-card">{content}</div>;
}
