import React from 'react';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showGradient?: boolean;
  className?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ 
  data, 
  width = 100, 
  height = 30,
  color,
  showDots = false,
  showGradient = true,
  className = ""
}) => {
  if (!data || !data.length) return null;

  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Create points for smooth curve
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return { x, y };
  });

  // Create smooth path using cubic bezier curves
  let pathData = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i - 1].x + 2 * (points[i].x - points[i - 1].x) / 3;
    const cp2y = points[i].y;
    
    pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }

  const gradientId = `sparkline-gradient-${Math.random()}`;
  const glowId = `sparkline-glow-${Math.random()}`;
  const chartColor = color || "var(--chart-primary)";

  // Create area path for gradient fill
  const areaPath = `${pathData} L ${width - padding} ${height} L ${padding} ${height} Z`;

  return (
    <svg 
      width={width} 
      height={height} 
      className={`overflow-visible ${className}`}
      style={{ opacity: 0.9 }}
    >
      <defs>
        {showGradient && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={chartColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={chartColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
          </linearGradient>
        )}
        
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Gradient area fill */}
      {showGradient && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          opacity="0.8"
        />
      )}
      
      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke={chartColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
        className="transition-all duration-300"
      />
      
      {/* Interactive dots */}
      {showDots && points.map((point, i) => (
        <g key={i}>
          <circle
            cx={point.x}
            cy={point.y}
            r="2"
            fill={chartColor}
            opacity="0"
            className="transition-opacity duration-200"
          >
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="3s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Hover area */}
          <circle
            cx={point.x}
            cy={point.y}
            r="8"
            fill="transparent"
            className="cursor-pointer"
          >
            <title>{`Value: ${data[i].toFixed(2)}`}</title>
          </circle>
        </g>
      ))}
      
      {/* End point indicator */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={chartColor}
        className="animate-pulse"
      />
    </svg>
  );
};

export default MiniSparkline;