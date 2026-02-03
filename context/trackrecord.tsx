"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

// Types
interface AuditData {
  date: string;
  profit: number;
  profit_hash: string;
  rami_burn: number;
  burn_hash: string;
  btc_reserve: number;
  treasury_hash: string;
  btc_purchase: number;
  purchase_hash: string;
}

interface BalanceHistory {
  date: string;
  trading_balance: number;
  note?: string;
}

interface RamicoinContextType {
  auditData: AuditData[];
  currentData: AuditData | null;
  selectedDateObj: Date;
  setSelectedDateObj: (date: Date) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  currentMonth: Date;
  setCurrentMonth: (month: Date) => void;
  isLoading: boolean;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  navigateMonth: (direction: number) => void;
  formatDate: (date: Date) => string;
  formatDateToKey: (date: Date) => string;
  shortenHash: (hash: string | undefined) => string;
  totalProfit: number; // Add this
  totalBtcReserveAllTime: number;
  totalRoiAllTime: number;
  totalRamiBurntFromBusiness: number;
  currentMonthProfit: number; // Add current month profit
  currentMonthRoi: number; // Add current month ROI
  currentTradingBalance: number;
  balanceHistory: BalanceHistory[];
  calculateEffectiveBalances: () => { [date: string]: number };
  getPurchaseHashDisplay: (hash: string) => {
    text: string;
    isLink: boolean;
    href: string | null;
  };
}

const RamicoinContext = createContext<RamicoinContextType | undefined>(
  undefined
);

export function RamicoinProvider({ children }: { children: ReactNode }) {
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Utility function to format date as YYYY-MM-DD (matches your data.json format)
  const formatDateToKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const suffixes = ["th", "st", "nd", "rd"];
    const suffix =
      day % 10 <= 3 && Math.floor(day / 10) !== 1
        ? suffixes[day % 10]
        : suffixes[0];
    return `${day}${suffix} ${MONTHS[month]} ${year}`;
  };

  const shortenHash = (hash: string | undefined): string => {
    if (!hash || hash === "-") return "-";
    if (hash === "CEX") return "CEX";
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 15)}...${hash.substring(hash.length - 5)}`;
  };

  // Get yesterday's date
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    // Reset time components to avoid timezone issues
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const [copied, setCopied] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(yesterday);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(yesterday);
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [currentData, setCurrentData] = useState<AuditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);

  const currentDate = useMemo(() => new Date(), []);

  // Fetch Balance Data
  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        const response = await fetch("/data/balance.json");
        const data = await response.json();
        setBalanceHistory(data);
      } catch (error) {
        console.error("Error fetching balance data:", error);
      }
    };
    fetchBalanceData();
  }, []);

  // Calculate effective balances for each day
  const calculateEffectiveBalances = useCallback(() => {
    const balances: { [date: string]: number } = {};

    if (balanceHistory.length === 0) return balances;

    // Sort balance history chronologically
    const sortedBalanceHistory = [...balanceHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Sort audit data chronologically
    const sortedAuditData = [...auditData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentBalance = sortedBalanceHistory[0].trading_balance;
    let balanceIndex = 0;

    sortedAuditData.forEach((item) => {
      const dateKey = item.date;
      const currentDate = new Date(dateKey);

      // Check if we need to update the balance for this date
      if (balanceIndex + 1 < sortedBalanceHistory.length) {
        const nextBalanceChangeDate = new Date(
          sortedBalanceHistory[balanceIndex + 1].date
        );

        if (currentDate >= nextBalanceChangeDate) {
          balanceIndex++;
          currentBalance = sortedBalanceHistory[balanceIndex].trading_balance;
        }
      }

      balances[dateKey] = currentBalance;
    });

    return balances;
  }, [auditData, balanceHistory]);

  // Current trading balance
  const currentTradingBalance = useMemo(() => {
    if (balanceHistory.length === 0) return 4497;

    // Get the latest balance entry
    const sortedBalanceHistory = [...balanceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedBalanceHistory[0].trading_balance;
  }, [balanceHistory]);

  // Fetch audit data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data/audit.json");
        const data = await response.json();
        setAuditData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching audit data:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update current data when selected date changes
  useEffect(() => {
    if (auditData.length > 0) {
      const formattedSelectedDate = formatDateToKey(selectedDateObj);
      const foundData = auditData.find(
        (item) => item.date === formattedSelectedDate
      );
      setCurrentData(foundData || null);
    }
  }, [selectedDateObj, auditData]);

  const navigateMonth = useCallback(
    (direction: number) => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + direction);
      setCurrentMonth(newMonth);
    },
    [currentMonth]
  );

  // total ramicoin burnt
  const totalRamiBurntFromBusiness = useMemo(() => {
    return auditData.reduce((sum, item) => sum + (item.rami_burn || 0), 0);
  }, [auditData]);

  // total profit
  const totalProfit = useMemo(() => {
    const grossProfit = auditData.reduce(
      (sum, item) => sum + (item.profit || 0),
      0
    );
    return grossProfit * 0.95;
  }, [auditData]);

  // total btc reserve
  const totalBtcReserveAllTime = useMemo(() => {
    return auditData.reduce((sum, item) => sum + (item.btc_purchase || 0), 0);
  }, [auditData]);

  // total ROI calculations
  const totalRoiAllTime = useMemo(() => {
    const effectiveBalances = calculateEffectiveBalances();
    let cumulativeProfit = 0;

    auditData.forEach((item) => {
      const dailyProfit = item.profit || 0;
      const dailyBalance = effectiveBalances[item.date] || 4497;

      if (dailyBalance > 0) {
        cumulativeProfit += (dailyProfit * 0.95) / dailyBalance;
      }
    });

    return cumulativeProfit * 100;
  }, [auditData, calculateEffectiveBalances]);

  // current month profit (August 2025) - after subtracting 5%
  const currentMonthProfit = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const grossProfit = auditData.reduce((sum, item) => {
      const itemDate = new Date(item.date);
      if (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      ) {
        return sum + (item.profit || 0);
      }
      return sum;
    }, 0);

    // Subtract 5% from the gross profit
    return grossProfit * 0.95;
  }, [auditData, currentDate]);

  // current month ROI = (currentMonthProfit / 4497) * 100
  const currentMonthRoi = useMemo(() => {
    const effectiveBalances = calculateEffectiveBalances();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    let monthlyRoi = 0;

    auditData.forEach((item) => {
      const itemDate = new Date(item.date);
      if (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      ) {
        const dailyProfit = item.profit || 0;
        const dailyBalance = effectiveBalances[item.date] || 4497;

        if (dailyBalance > 0) {
          monthlyRoi += (dailyProfit * 0.95) / dailyBalance;
        }
      }
    });

    return monthlyRoi * 100;
  }, [auditData, currentDate, calculateEffectiveBalances]);

  // In your RamicoinProvider component, add this function
  const getPurchaseHashDisplay = useCallback(
    (hash: string) => {
      if (!hash || hash === "-") {
        return {
          text: "-",
          isLink: false,
          href: null,
        };
      }

      if (hash === "CEX") {
        return {
          text: "on central exchange",
          isLink: false,
          href: null,
        };
      }

      return {
        text: shortenHash(hash),
        isLink: true,
        href: `https://bscscan.com/tx/${hash}`,
      };
    },
    [shortenHash]
  );

  const value = {
    auditData,
    currentData,
    selectedDateObj,
    setSelectedDateObj,
    isCalendarOpen,
    setIsCalendarOpen,
    currentMonth,
    setCurrentMonth,
    isLoading,
    copied,
    setCopied,
    navigateMonth,
    formatDate,
    formatDateToKey,
    shortenHash,
    totalProfit,
    totalBtcReserveAllTime,
    totalRoiAllTime,
    totalRamiBurntFromBusiness,
    currentMonthProfit,
    currentMonthRoi,
    currentTradingBalance,
    balanceHistory,
    calculateEffectiveBalances,
    getPurchaseHashDisplay,
  };

  return (
    <RamicoinContext.Provider value={value}>
      {children}
    </RamicoinContext.Provider>
  );
}

export function useRamicoin() {
  const context = useContext(RamicoinContext);
  if (context === undefined) {
    throw new Error("useRamicoin must be used within a RamicoinProvider");
  }
  return context;
}
