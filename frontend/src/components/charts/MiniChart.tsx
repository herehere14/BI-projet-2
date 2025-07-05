import React from "react";

interface MiniChartProps {
  data: number[];
  color?: string;
  showArea?: boolean;
  className?: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ 
  data, 
  color, 
  showArea = false,
  className = ""
}) => {
  if (!data || data.length === 0) return null;

  const width = 120;
  const height = 32;
  const padding = 4;
  
  // Normalize data
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Create smooth curve points using bezier curves
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = padding + ((max - value) / range) * (height - 2 * padding);
    return { x, y };
  });
  
  // Create smooth path
  let pathData = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i - 1].x + 2 * (points[i].x - points[i - 1].x) / 3;
    const cp2y = points[i].y;
    
    pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }
  
  const areaPath = `${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  // Dynamic color based on theme
  const chartColor = color || "var(--chart-primary)";

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={`w-full h-full ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={chartColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#gradient-${Math.random()})`}
          className="transition-opacity duration-300"
        />
      )}
      
      <path
        d={pathData}
        fill="none"
        stroke={chartColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300 hover:stroke-[2.5]"
        style={{
          filter: "drop-shadow(0 0 4px rgba(0, 163, 255, 0.3))"
        }}
      />
      
      {/* Data points */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="0"
          fill={chartColor}
          className="transition-all duration-200"
        >
          <animate
            attributeName="r"
            values="0;2;0"
            dur="2s"
            begin={`${i * 0.1}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="2s"
            begin={`${i * 0.1}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
};

export default MiniChart;