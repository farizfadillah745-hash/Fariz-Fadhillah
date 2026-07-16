import React, { useState } from 'react';

// Custom format currency for Indonesia Rupiah
export const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface AreaChartProps {
  data: { date: string; amount: number; commission?: number }[];
  height?: number;
}

export const RevenueAreaChart: React.FC<AreaChartProps> = ({ data, height = 220 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-gray-400 font-sans text-sm">
        Tidak ada data laporan penjualan.
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => d.amount), 1000000);
  const width = 500;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate coordinates for SVG
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = height - padding - (d.amount / maxAmount) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="relative w-full overflow-hidden font-sans">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * chartHeight;
          const val = maxAmount * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-mono font-medium"
              >
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          // Show label for first, middle, last to keep it clean
          const shouldShow = idx === 0 || idx === points.length - 1 || (points.length > 2 && idx === Math.floor(points.length / 2));
          if (!shouldShow) return null;
          // Format date to short readable: e.g. 15 Jul
          const dateParts = p.date.split('-');
          const label = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : p.date;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - padding + 18}
              textAnchor="middle"
              className="text-[10px] fill-gray-500 font-sans"
            >
              {label}
            </text>
          );
        })}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* The Area */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* The Stroke line */}
        <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive hover points */}
        {points.map((p, idx) => (
          <g
            key={idx}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-pointer"
          >
            {/* Invisibly larger touch target */}
            <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
            {/* Real dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === idx ? "6" : "4"}
              fill={hoveredIndex === idx ? "#10B981" : "#FFFFFF"}
              stroke="#10B981"
              strokeWidth="2"
              className="transition-all duration-150"
            />
          </g>
        ))}
      </svg>

      {/* Hover Tooltip Overlay */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div 
          className="absolute bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs z-20 pointer-events-none transition-all duration-150 border border-slate-800"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold text-gray-300">{points[hoveredIndex].date}</div>
          <div className="font-bold text-emerald-400 mt-0.5">{formatIDR(points[hoveredIndex].amount)}</div>
          {points[hoveredIndex].commission !== undefined && (
            <div className="text-[10px] text-gray-400 mt-0.5">Platform: {formatIDR(points[hoveredIndex].commission || 0)}</div>
          )}
        </div>
      )}
    </div>
  );
};

interface DonutChartProps {
  data: { category: string; amount: number }[];
  height?: number;
}

export const CategoryDonutChart: React.FC<DonutChartProps> = ({ data, height = 200 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-gray-400 font-sans text-sm">
        Tidak ada data kategori.
      </div>
    );
  }

  const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'];
  const labels: { [key: string]: string } = {
    baju: 'Baju / Pakaian',
    sepatu: 'Sepatu',
    aksesori: 'Aksesoris & Tas'
  };

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const size = 180;
  const radius = 55;
  const strokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = -Math.PI / 2; // start at top

  const segments = data.map((d, i) => {
    const percentage = total > 0 ? d.amount / total : 0;
    const strokeDashoffset = circumference * (1 - percentage);
    const angle = percentage * 360;
    const currentAngle = accumulatedAngle;
    accumulatedAngle += percentage * Math.PI * 2;

    return {
      ...d,
      color: colors[i % colors.length],
      percentage,
      strokeDashoffset,
      angle: currentAngle,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2 font-sans">
      <div className="relative w-44 h-44">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 origin-center"
              style={{
                transform: `rotate(${idx === 0 ? 0 : (segments.slice(0, idx).reduce((acc, s) => acc + s.percentage, 0) * 360)}deg)`,
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center overlay label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total</span>
          <span className="text-sm font-extrabold text-gray-800">
            {hoveredIndex !== null && segments[hoveredIndex]
              ? formatIDR(segments[hoveredIndex].amount)
              : formatIDR(total)}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {hoveredIndex !== null && segments[hoveredIndex]
              ? `${labels[segments[hoveredIndex].category] || segments[hoveredIndex].category} (${(segments[hoveredIndex].percentage * 100).toFixed(0)}%)`
              : 'Semua Kategori'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              hoveredIndex === idx ? 'bg-slate-50' : ''
            }`}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-700">{labels[seg.category] || seg.category}</span>
              <span className="text-[11px] text-gray-500 font-mono">
                {formatIDR(seg.amount)} ({total > 0 ? ((seg.amount / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
