"use client";

import { useState, useEffect } from "react";
import OfflinePage from "@/components/Old/Offline/OfflinePage";

export default function OfflineWrapper({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    updateStatus(); // Initial check

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return isOnline ? children : <OfflinePage />;
}
