import React, { useEffect, useState, createContext } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";
import { ConfigProvider } from "./contexts/ConfigContext";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";

import { CreateGroup } from "./pages/CreateGroup";
import { ViewGroup } from "./pages/ViewGroup";
import { JoinGroup } from "./pages/JoinGroup";
import { ScanQRCode } from "./pages/ScanQRCode";
import { Home } from "./pages/Home";

export const NotificationContext = createContext();
export const AppContext = createContext();

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 1rem 0;
  padding-top: calc(env(safe-area-inset-top) + 1rem);
  min-height: 100%;
  box-sizing: border-box;
`;

const Pages = {
  Home: {
    id: "HOME",
    url: "",
    title: "WAVE",
    component: Home
  },
  CreateGroup: {
    id: "CREATE_GROUP",
    url: "create-group",
    title: "Create Group",
    component: CreateGroup
  },
  ViewGroup: {
    id: "VIEW_GROUP",
    component: ViewGroup
  },
  JoinGroup: {
    id: "JOIN_GROUP",
    component: JoinGroup
  },
  ScanQRCode: {
    id: "SCAN_QR_CODE",
    url: "scan",
    title: "Scan",
    component: ScanQRCode
  }
};

const customProps = new Set([
  "visible",
  "isResizing",
  "isPWA",
  "prominence",
  "size",
  "stretch"
]);

const shouldForwardProp = (prop) => isPropValid(prop) && !customProps.has(prop);

function App() {
  const [title, setTitle] = useState("WAVE");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [pushPermission, setPushPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  const [isPWA] = useState(() => {
    const standaloneMode = window.navigator.standalone;

    const displayModeStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    const fromHomescreen = window.location.search.includes("source=pwa");

    return standaloneMode || displayModeStandalone || fromHomescreen;
  });

  const setPageAndTitle = (pageId) => {
    const currentPageKey = Object.keys(Pages).find(
      (key) => Pages[key].id === pageId || Pages[key].url === pageId
    );

    if (currentPageKey) {
      setPage(Pages[currentPageKey].id);
      setTitle(Pages[currentPageKey].title);
    } else {
      return;
    }
  };

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const urlParts = path.substring(1).split("/");

    if (urlParts.length === 2) {
      // For viewing a specific group
      const [groupId, userId] = urlParts;

      if (userId === "join") {
        setPage(Pages.JoinGroup.id);
        setTitle(groupId);
        setGroupId(groupId);
      } else {
        setPage(Pages.ViewGroup.id);
        setTitle(groupId);
        setGroupId(groupId);
        setUserId(userId);
      }

      if (!groupId) {
        alert("No group ID");
        return;
      }

      if (!userId) {
        alert("No user ID");
        return;
      }
    } else {
      // For all other known pages
      const pageId = urlParts[0];
      setPageAndTitle(pageId || Pages.Home.id);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const registerServiceWorker = async () => {
      try {
        if (!("serviceWorker" in navigator)) {
          if (mounted) setIsCheckingSubscription(false);
          return;
        }

        // Only proceed with service worker registration if push notifications are enabled
        const notificationPreference = localStorage.getItem(
          "notificationPreference"
        );
        if (notificationPreference !== "PUSH") {
          if (mounted) setIsCheckingSubscription(false);
          return;
        }

        if (mounted) setIsCheckingSubscription(true);

        const existingRegistrations =
          await navigator.serviceWorker.getRegistrations();
        let registration = existingRegistrations.find((reg) =>
          reg.scope.includes("/service-workers/")
        );

        if (!registration) {
          registration = await navigator.serviceWorker.register(
            "/service-workers/web-push-notifications.js",
            { scope: "/service-workers/" }
          );

          if (registration.installing) {
            await new Promise((resolve) => {
              registration.installing.addEventListener("statechange", (e) => {
                if (e.target.state === "activated") {
                  resolve();
                }
              });
            });
          }
        }

        if ("Notification" in window) {
          setPushPermission(Notification.permission);
        }

        const subscription = await registration.pushManager.getSubscription();
        if (mounted) {
          setIsSubscribed(!!subscription);
          setIsCheckingSubscription(false);
        }
      } catch (error) {
        console.error("Service worker registration failed:", error);
        if (mounted) setIsCheckingSubscription(false);
      }
    };

    registerServiceWorker();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestNotificationPermission = async () => {
    try {
      setIsSubscriptionLoading(true);

      if (!("Notification" in window)) {
        throw new Error("This browser does not support notifications");
      }

      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      return permission;
    } catch (error) {
      console.error("Error requesting permission:", error);
      throw error;
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ConfigProvider>
        <AppContext.Provider value={{ isPWA }}>
          <NotificationContext.Provider
            value={{
              isSubscribed,
              setIsSubscribed,
              isCheckingSubscription,
              pushPermission,
              setPushPermission,
              isSubscriptionLoading,
              setIsSubscriptionLoading,
              requestNotificationPermission
            }}
          >
            <BrowserRouter basename="/">
              <Container>
                {page === Pages.Home.id && <Home />}
                {page === Pages.CreateGroup.id && <CreateGroup />}
                {page === Pages.ViewGroup.id && (
                  <ViewGroup groupId={groupId} userId={userId} />
                )}
                {page === Pages.JoinGroup.id && <JoinGroup groupId={groupId} />}
                {page === Pages.ScanQRCode.id && <ScanQRCode />}
              </Container>
            </BrowserRouter>
          </NotificationContext.Provider>
        </AppContext.Provider>
      </ConfigProvider>
    </StyleSheetManager>
  );
}

export default App;
