'use client'

import { useRamicoin } from "@/context/trackrecord";

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CalendarModal = () => {
  const {
    isCalendarOpen,
    setIsCalendarOpen,
    currentMonth,
    navigateMonth,
    selectedDateObj,
    setSelectedDateObj,
    auditData,
    formatDateToKey
  } = useRamicoin();

  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isSelectedDate = (day: number | null): boolean => {
    if (!day) return false;
    return day === selectedDateObj.getDate() &&
      currentMonth.getMonth() === selectedDateObj.getMonth() &&
      currentMonth.getFullYear() === selectedDateObj.getFullYear();
  };

  // check if day has profit or not or no-data
  const getProfitStatusForDate = (
    day: number | null
  ): "profit" | "no-profit" | "no-data" => {
    if (!day) return "no-data";

    const dateToCheck = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    const formattedDate = formatDateToKey(dateToCheck);
    const auditItem = auditData.find((item) => item.date === formattedDate);

    if (!auditItem) return "no-data";

    // Check if profit exists and is greater than 0
    if (auditItem.profit && auditItem.profit > 0) {
      return "profit";
    }

    return "no-profit";
  };

  const days = getDaysInMonth(currentMonth);

  if (!isCalendarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsCalendarOpen(false)}
      ></div>

      {/* Calendar Container */}
      <div className="relative bg-[#000000] rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-black/10 rounded-lg transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-ui text-white">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-sm text-white/70 font-ui py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isSelected = isSelectedDate(day);
            const profitStatus = getProfitStatusForDate(day);
            const hasData = profitStatus !== "no-data";

            return (
              <button
                key={index}
                onClick={() => {
                  if (day) {
                    const newDate = new Date(currentMonth);
                    newDate.setDate(day);
                    setSelectedDateObj(newDate);
                    setIsCalendarOpen(false);
                  }
                }}
                disabled={!day}
                className={`
                  h-10 w-10 rounded-lg text-sm font-ui transition-all duration-200 flex items-center justify-center
                  ${day
                    ? 'text-white hover:bg-[#ffffff] hover:text-black  active:scale-95'
                    : 'cursor-not-allowed'
                  }
                  ${
                    isSelected
                      ? profitStatus === "profit"
                        ? "bg-green-500 font-ui"
                        : "bg-gray-600 font-ui"
                      : ""
                  }
                  relative
                `}
              >
                {day}
                {hasData && day && (
                  <span
                    className={`absolute bottom-1 rounded-full ${
                      profitStatus === "profit"
                        ? "w-2 h-2 bg-green-500"
                        : "w-1 h-1 bg-gray-600"
                    }`}
                  ></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsCalendarOpen(false)}
          className="absolute -top-2 -right-2 bg-black text-[#ffffff]/80 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CalendarModal;

