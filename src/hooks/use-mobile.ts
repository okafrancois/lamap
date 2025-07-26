"use client";

import { useState, useEffect } from "react";

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Utiliser plusieurs critères pour détecter mobile
      const userAgent = navigator.userAgent;
      const isMobileUserAgent =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent,
        );
      const isSmallScreen = window.innerWidth < 768; // md breakpoint
      const isTouchDevice = "ontouchstart" in window;

      // Considérer comme mobile si c'est un petit écran OU un appareil mobile
      setIsMobile(isMobileUserAgent || (isSmallScreen && isTouchDevice));
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return isMobile;
}
