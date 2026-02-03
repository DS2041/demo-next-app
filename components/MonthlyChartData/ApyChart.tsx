'use client'

import { useRamicoin } from "@/context/trackrecord";
import { useMemo } from 'react';

interface MonthlyApyData {
  month: string;
  apy: number;
  year: number;
  monthIndex: number;
}

export default function ApyChart() {
  const { auditData, calculateEffectiveBalances } = useRamicoin();

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  // Calculate monthly APY data for current and previous year
  const monthlyApyData = useMemo((): MonthlyApyData[] => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const effectiveBalances = calculateEffectiveBalances();
    
    const monthlyData: MonthlyApyData[] = [];
    
    // Add data for current year
    months.forEach((month, index) => {
      monthlyData.push({
        month,
        apy: 0,
        year: currentYear,
        monthIndex: index
      });
    });
    
    // Add data for previous year
    months.forEach((month, index) => {
      monthlyData.push({
        month,
        apy: 0,
        year: currentYear - 1,
        monthIndex: index
      });
    });

    // Calculate APY for each month (APY = (profit / 4497) * 100)
    auditData.forEach(item => {
      const date = new Date(item.date);
      const itemYear = date.getFullYear();
      const monthIndex = date.getMonth();

      if (itemYear === currentYear || itemYear === currentYear - 1) {
        const dataIndex = monthlyData.findIndex(
          data => data.monthIndex === monthIndex && data.year === itemYear
        );

        if (dataIndex !== -1) {
          const dailyBalance = effectiveBalances[item.date] || 4497;
          if (dailyBalance > 0) {
            monthlyData[dataIndex].apy += (item.profit * 0.95 / dailyBalance) * 100;
          }
        }
      }
    });

    return monthlyData;
  }, [auditData, calculateEffectiveBalances, currentYear]);

  // Get last 5 months + current month (handling year transition)
  const recentMonthsData = useMemo(() => {
    const result = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      let monthIndex, year;
      
      if (targetMonth < 0) {
        // Previous year
        monthIndex = targetMonth + 12;
        year = currentYear - 1;
      } else {
        // Current year
        monthIndex = targetMonth;
        year = currentYear;
      }
      
      const monthData = monthlyApyData.find(data => 
        data.monthIndex === monthIndex && data.year === year
      );
      
      if (monthData) {
        result.push(monthData);
      }
    }
    
    return result;
  }, [monthlyApyData, currentMonth, currentYear]);

  // Check if we have data from both years
  const hasMultipleYears = useMemo(() => {
    const years = new Set(recentMonthsData.map(data => data.year));
    return years.size > 1;
  }, [recentMonthsData]);

  // Get max APY value for scaling
  const maxApy = useMemo(() => {
    return Math.max(...recentMonthsData.map(data => data.apy), 10);
  }, [recentMonthsData]);

  // Calculate bar height percentage
  const calculateBarHeight = (apy: number) => {
    return Math.max((apy / maxApy) * 60, 8);
  };

  // Determine year label text
  const yearLabel = hasMultipleYears 
    ? `${currentYear - 1}-${currentYear}`
    : `${currentYear}`;

  return (
    <div className="w-full">
      <div className="flex items-end gap-3 pb-5 justify-center">
        {recentMonthsData.map((data, index) => (
          <div 
            key={`${data.year}-${data.month}`}
            className="relative flex flex-col items-center flex-shrink-0"
            style={{ width: '40px' }}
          >
            <span className="absolute top-0 -mt-6 text-xs font-normal text-black tracking-normal">
              {data.apy > 0 ? `${data.apy.toFixed(1)}%` : ''}
            </span>
            <div 
              className="w-full rounded-t-xs"
              style={{ 
                height: `${calculateBarHeight(data.apy)}px`,
                backgroundColor: data.year === currentYear ? '#26a17b' : '#ff00f2',
                minHeight: '4px'
              }}
            ></div>
            <span className="absolute bottom-0 -mb-6 text-xs font-normal text-black opacity-50 tracking-wide">
              {data.month}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-start mt-7">
        <div className="flex items-center">
          <span className='text-[#000000]/70 text-lg tracking-normal'>
            APY {yearLabel}
          </span>
        </div>
      </div>

      {/* Show year indicator on bars if we have multiple years */}
      {hasMultipleYears && (
        <div className="flex justify-center mt-2 gap-4">
          <div className="flex items-center">
            <span className="block w-3 h-3 bg-[#ff00f2] rounded-sm mr-1"></span>
            <span className="text-xs text-black opacity-70">{currentYear - 1}</span>
          </div>
          <div className="flex items-center">
            <span className="block w-3 h-3 bg-[#26a17b] rounded-sm mr-1"></span>
            <span className="text-xs text-black opacity-70">{currentYear}</span>
          </div>
        </div>
      )}
    </div>
  );

}


