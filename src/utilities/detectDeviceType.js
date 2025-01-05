import { useState, useEffect } from "react";

export const useDetectDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
  }, []);

  return isMobile ? "mobile" : "desktop";
};
