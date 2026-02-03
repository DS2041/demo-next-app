'use client'

import { useTimer } from "@/hooks/useTimer";


interface StatusBadgeProps {
    status: string;
    className?: string;
productTitle?: string; // ADD this line
  }

const StatusBadge = ({ status, className = '', productTitle = "" }: StatusBadgeProps) => {

  // ADD this check for I-Gaming
  const isIGaming = productTitle.toLowerCase() === "i-gaming";
  
  // ADD this block - Timer only for I-Gaming
  if (isIGaming && status.toLowerCase() === "coming soon") {
    const { days, hours, minutes, seconds, isPartyTime } = useTimer("1/5/2026 23:59:59");
    
    if (isPartyTime) {
      return (
        <div className={`absolute top-4 left-4 z-20 px-2.5 py-0.5 rounded-sm text-xs font-medium border bg-green-100 text-green-800 border-green-400 flex items-center gap-1.5 ${className}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Live
        </div>
      );
    }
    
    // FIXED: Changed from red to orange
    return (
      <div className={`absolute top-4 left-4 z-20 px-2.5 py-0.5 rounded-sm text-xs font-medium border bg-orange-100 text-orange-800 border-orange-400 flex items-center gap-1.5 ${className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        <span className="font-ui text-xs">
          {String(days).padStart(2, "0")}:
          {String(hours).padStart(2, "0")}:
          {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }
  
    const getStatusConfig = () => {
        switch (status.toLowerCase()) {
            case 'live':
                return {
                    text: 'Live',
                    styles: 'bg-green-100 text-green-800 border-green-400 tracking-wide',
                    dot: 'bg-green-500'
                };
            case 'coming soon':
                return {
                    text: 'coming soon',
                    styles: 'bg-red-100 text-red-800 border-red-400',
                    dot: 'bg-red-500'
                };
            default:
                return {
                    text: 'coming soon',
                    styles: 'bg-red-100 text-red-800 border-red-400',
                    dot: 'bg-red-500'
                };
        }
    };

    const { text, styles, dot } = getStatusConfig();

    return (
        <div className={`absolute top-4 left-4 z-20 px-2.5 py-0.5 rounded-sm text-xs font-medium border flex items-center gap-1.5 ${styles} ${className}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {text}
        </div>
    );
};

export default StatusBadge;