import { useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";
import PullToRefresh from "pulltorefreshjs";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
      instructionsPullToRefresh: "",
      instructionsReleaseToRefresh: "",
      instructionsRefreshing: "",
      refreshTimeout: 500,
      // Disable on desktop
      shouldPullToRefresh: () => {
        return window.innerWidth <= 768;
      },
      // Custom icon using FontAwesome rotate icon with ReactDOMServer
      iconArrow: ReactDOMServer.renderToString(
        <FontAwesomeIcon icon={faRotate} />
      ),
      iconRefreshing: ReactDOMServer.renderToString(
        <FontAwesomeIcon icon={faRotate} spin={true} />
      )
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
