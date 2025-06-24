import { useEffect, useRef } from "react";
import PullToRefresh from "pulltorefreshjs";

export const usePullToRefresh = (isPWA, onRefresh, pageId) => {
  const ptrRef = useRef(null);

  useEffect(() => {
    // Only initialize pull-to-refresh in PWA mode
    if (!isPWA) {
      return;
    }

    // Initialize PullToRefresh
    ptrRef.current = PullToRefresh.init({
      mainElement: "body",
      onRefresh: () => {
        if (onRefresh) {
          onRefresh();
        } else {
          // Default refresh behavior
          window.location.reload();
        }
      },
      // Customize the appearance for better PWA experience
      distThreshold: 60,
      distMax: 80,
      distReload: 50,
      instructionsPullToRefresh: "Pull down to refresh",
      instructionsReleaseToRefresh: "Release to refresh",
      instructionsRefreshing: "Refreshing...",
      refreshTimeout: 500,
      // Disable on desktop
      shouldPullToRefresh: () => {
        return window.innerWidth <= 768;
      },
      // Custom icon using FontAwesome rotate icon
      iconArrow: '<i class="fa-solid fa-rotate"></i>',
      iconRefreshing: '<i class="fa-solid fa-rotate fa-spin"></i>'
    });

    // Cleanup function
    return () => {
      if (ptrRef.current) {
        ptrRef.current.destroy();
        ptrRef.current = null;
      }
    };
  }, [isPWA, onRefresh, pageId]);

  return ptrRef.current;
};
