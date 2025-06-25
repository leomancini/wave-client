import { useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";
import PullToRefresh from "pulltorefreshjs";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const usePullToRefresh = (
  isPWA,
  onRefresh,
  pageId,
  isMoreMenuOpen = false
) => {
  const ptrRef = useRef(null);

  useEffect(() => {
    if (!isPWA || isMoreMenuOpen) {
      // Destroy existing instance if more menu opens
      if (ptrRef.current) {
        ptrRef.current.destroy();
        ptrRef.current = null;
      }
      return;
    }

    ptrRef.current = PullToRefresh.init({
      mainElement: "body",
      onRefresh: () => {
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      },
      distThreshold: 60,
      distMax: 500,
      distReload: 50,
      instructionsPullToRefresh: " ",
      instructionsReleaseToRefresh: " ",
      instructionsRefreshing: " ",
      refreshTimeout: 500,
      iconArrow: ReactDOMServer.renderToString(
        <FontAwesomeIcon icon={faRotate} />
      ),
      iconRefreshing: ReactDOMServer.renderToString(
        <FontAwesomeIcon icon={faRotate} spin={true} />
      )
    });

    return () => {
      if (ptrRef.current) {
        ptrRef.current.destroy();
        ptrRef.current = null;
      }
    };
  }, [isPWA, onRefresh, pageId, isMoreMenuOpen]);

  return ptrRef.current;
};
