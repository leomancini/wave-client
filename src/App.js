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

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

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

  const checkSubscriptionStatus = async () => {
    try {
      if (!("serviceWorker" in navigator)) {
        setIsCheckingSubscription(false);
        setIsSubscribed(false);
        return false;
      }

      setIsCheckingSubscription(true);

      const existingRegistrations =
        await navigator.serviceWorker.getRegistrations();
      let registration = existingRegistrations.find((reg) =>
        reg.scope.includes("/service-workers/")
      );

      if (!registration) {
        setIsSubscribed(false);
        setIsCheckingSubscription(false);
        return false;
      }

      if ("Notification" in window) {
        setPushPermission(Notification.permission);
        if (Notification.permission !== "granted") {
          setIsSubscribed(false);
          setIsCheckingSubscription(false);
          return false;
        }
      }

      const subscription = await registration.pushManager.getSubscription();
      const isValid = !!subscription && !!subscription.endpoint;
      setIsSubscribed(isValid);
      setIsCheckingSubscription(false);
      return isValid;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setIsSubscribed(false);
      setIsCheckingSubscription(false);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      if (mounted) await checkSubscriptionStatus();
    };

    checkStatus();
    // Set up an interval to periodically check subscription status
    const intervalId = setInterval(checkStatus, 60000); // Check every minute

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
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

  const setupPushNotifications = async (groupId, userId) => {
    try {
      setIsSubscriptionLoading(true);
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        const registrations = await navigator.serviceWorker.getRegistrations();
        let registration = registrations.find((reg) =>
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

        if (!registration) {
          throw new Error("Service worker registration failed");
        }

        const existingSubscription =
          await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await existingSubscription.unsubscribe();
        }

        const convertedVapidKey = urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY
        );

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/web-push/save-subscription/${groupId}/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription)
          }
        );

        await response.json();
        await checkSubscriptionStatus();
      }
    } catch (error) {
      console.error("Error setting up push notifications:", error);
      setIsSubscribed(false);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const unsubscribePushNotifications = async (groupId, userId) => {
    try {
      setIsSubscriptionLoading(true);
      const registrations = await navigator.serviceWorker.getRegistrations();
      const registration = registrations.find((reg) =>
        reg.scope.includes("/service-workers/")
      );

      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch(
            `${process.env.REACT_APP_API_URL}/web-push/remove-subscription/${groupId}/${userId}`,
            { method: "POST" }
          );
        }
        await registration.unregister();
      }
      await checkSubscriptionStatus();
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      setIsSubscribed(false);
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
              requestNotificationPermission,
              setupPushNotifications,
              unsubscribePushNotifications,
              checkSubscriptionStatus
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
