"use client";

import { useTimer } from "@/hooks/useTimer";

interface TimerDisplayProps {
  targetDate?: string;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export default function TimerDisplay({
  targetDate = "1/5/2026 23:59:59",
  showLabels = false,
  compact = false,
  className = "",
}: TimerDisplayProps) {
  const { days, hours, minutes, seconds, isPartyTime } = useTimer(targetDate);

  if (isPartyTime) {
    return (
      <div className={`font-ui ${compact ? "text-sm" : "text-base"} ${className}`}>
        Live Now!
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`font-ui ${className}`}>
        <span>{String(days).padStart(2, "0")}:</span>
        <span>{String(hours).padStart(2, "0")}:</span>
        <span>{String(minutes).padStart(2, "0")}:</span>
        <span>{String(seconds).padStart(2, "0")}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="font-ui text-2xl md:text-3xl flex gap-1">
        <span className="min-w-[2ch] text-center">{String(days).padStart(2, "0")}</span>
        <span>:</span>
        <span className="min-w-[2ch] text-center">{String(hours).padStart(2, "0")}</span>
        <span>:</span>
        <span className="min-w-[2ch] text-center">{String(minutes).padStart(2, "0")}</span>
        <span>:</span>
        <span className="min-w-[2ch] text-center">{String(seconds).padStart(2, "0")}</span>
      </div>
      
      {showLabels && (
        <div className="flex gap-4 text-xs text-gray-600 mt-1">
          <span className="min-w-[2ch] text-center">DD</span>
          <span>HH</span>
          <span className="min-w-[2ch] text-center">MM</span>
          <span>SS</span>
        </div>
      )}
    </div>
  );
}