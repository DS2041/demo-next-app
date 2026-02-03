"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname } from "next/navigation";
import "nprogress/nprogress.css";

// Customize NProgress styles
NProgress.configure({ showSpinner: false });

const ProgressBar = () => {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
    }, 4000); // Adjust timing as needed

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname]);

  return null;
};

export default ProgressBar;
