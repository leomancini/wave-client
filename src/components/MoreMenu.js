import styled from "styled-components";
import { useState, useRef, useEffect, useContext } from "react";

import { faXmark, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";
import { useDetectDeviceType } from "../utilities/detectDeviceType";

import { Button } from "./Button";
import { Separator } from "./Separator";
import { Spinner } from "./Spinner";
import { NotificationContext, AppContext } from "../App";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const Container = styled.div`
  position: fixed;
  top: 0;
  padding-bottom: ${(props) =>
    props.$isPWA ? "0" : "env(safe-area-inset-bottom)"};
  padding-top: env(safe-area-inset-top);
  width: 100%;
  max-width: 32rem;
  max-height: 100vh;
  height: 100%;
  min-height: 100%;
  background-color: white;
  z-index: 1000;
  pointer-events: none;
  will-change: transform, opacity;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  perspective: 1000px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  box-sizing: border-box;
  will-change: transform, opacity;
  transform-style: preserve-3d;
  display: flex;
  flex-direction: column;

  transform: translate3d(calc(-100% - 2rem), 0, 0);
  transition: ${(props) =>
    props.$isResizing ? "none" : "transform 0.4s ease-in-out"};
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  opacity: 1;
  visibility: visible;

  @media (min-width: 32rem) {
    opacity: 0;
    visibility: hidden;
    transform: translate3d(-4rem, 0, 0);
    transition: ${(props) =>
      props.$isResizing
        ? "none"
        : "transform 0.4s ease-in-out, opacity 0.3s ease-out, visibility 0s linear 0.4s"};
    box-shadow: unset;
    padding-left: 3rem;
    padding-right: 3rem;

    width: calc(100% + 6rem);
    max-width: calc(32rem + 6rem);
  }

  ${(props) =>
    props.$visible &&
    `
    pointer-events: auto;
    transform: translate3d(0, 0, 0);
    transition: ${props.$isResizing ? "none" : "transform 0.4s ease-in-out"};

    @media (min-width: 32rem) {
      transform: translate3d(0, 0, 0);
      opacity: 1;
      visibility: visible;
      transition: ${
        props.$isResizing
          ? "none"
          : "transform 0.4s ease-in-out, opacity 0.3s ease-out, visibility 0s linear"
      };
    }
  `}
`;

const Header = styled.div`
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  height: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  background: white;
  z-index: 1;
  transform: translateZ(0);
  will-change: transform;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(props) => props.$justifyContent};
  width: 100%;
`;

const GroupTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
`;

const HeaderShadow = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1rem;
  height: 1rem;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  transform: translateZ(0);
  will-change: transform;
  -webkit-backface-visibility: hidden;
`;

const Content = styled.div`
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  background-color: white;
  gap: 1.5rem;
  overflow-x: hidden;
  overflow-y: scroll;
  flex: 1;
  min-height: 0;
  transform: translateZ(0);
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const SectionLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05rem;
  flex: 1;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const ListItem = styled.div`
  width: 100%;
`;

const ListItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3rem;
  padding: 0.5rem 0;
`;

const ListItemLabel = styled.div`
  font-size: 1rem;
`;

const ListItemValue = styled.div`
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: normal;
`;

const StyledReaction = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
`;

const ReactionEmoji = styled.div`
  font-size: 1.25rem;
`;

const QRCodeContainer = styled.div`
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2rem;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0;
  background-color: rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;

  img {
    width: calc(100% - 4rem);
    height: calc(100% - 4rem);
  }
`;

const Reaction = ({ reaction, count }) => (
  <StyledReaction key={reaction}>
    <ReactionEmoji>{reaction}</ReactionEmoji>
    {count}
  </StyledReaction>
);

const UserListItem = ({ user, showSeparator }) => (
  <ListItem>
    <ListItemContent>
      <ListItemValue>
        <UserAvatar>{user.name.substring(0, 1).toUpperCase()}</UserAvatar>
        {user.name}
      </ListItemValue>
    </ListItemContent>
    {showSeparator && <Separator />}
  </ListItem>
);

const requestPushSubscription = async (
  groupId,
  userId,
  permission,
  setIsSubscribed,
  setIsSubscriptionLoading,
  isUnsubscribing = false
) => {
  try {
    console.log(
      isUnsubscribing
        ? "Starting unsubscribe..."
        : "Starting push subscription request..."
    );

    setIsSubscriptionLoading(true);

    // Get the existing registration
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations.find((reg) =>
      reg.scope.includes("/service-workers/")
    );

    if (!registration) {
      throw new Error("Service worker not found");
    }

    console.log("Found service worker registration:", registration);

    // Check existing subscription
    const existingSubscription =
      await registration.pushManager.getSubscription();

    // Handle unsubscribe request
    if (isUnsubscribing) {
      if (!existingSubscription) {
        console.log("No subscription to unsubscribe from");
        setIsSubscribed(false);
        return { success: true };
      }

      console.log("Unsubscribing from push notifications...");
      await existingSubscription.unsubscribe();

      // Notify the server
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/web-push/remove-subscription/${groupId}/${userId}`,
        { method: "POST" }
      );

      const data = await response.json();
      console.log("Server unsubscribe response:", data);
      setIsSubscribed(false);
      return data;
    }

    // Rest of the existing subscription logic...
    if (permission !== "granted") {
      throw new Error("Permission not granted");
    }

    if (existingSubscription) {
      console.log("Found existing subscription, attempting to renew...");
      try {
        const renewResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/web-push/renew-subscription/${groupId}/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existingSubscription)
          }
        );

        const renewData = await renewResponse.json();
        console.log("Renewal response:", renewData);
        setIsSubscribed(renewData.success);
        return renewData;
      } catch (error) {
        console.error("Error renewing subscription:", error);
      }
    }

    console.log("Creating new subscription...");
    const convertedVapidKey = urlBase64ToUint8Array(
      process.env.REACT_APP_VAPID_PUBLIC_KEY
    );

    console.log("Attempting to subscribe...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    console.log("Subscription successful:", subscription);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/web-push/save-subscription/${groupId}/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      }
    );

    const data = await response.json();
    console.log("Server response:", data);

    setIsSubscribed(data.success);
    return data;
  } catch (error) {
    console.error("Push subscription failed:", error);
    setIsSubscribed(false);
    alert(`Subscription error: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    setIsSubscriptionLoading(false);
  }
};

export const MoreMenu = ({
  $visible,
  setIsMoreMenuVisible,
  groupId,
  users,
  user,
  stats,
  statsIsLoading
}) => {
  const { config } = useConfig();
  const contentRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimerRef = useRef(null);
  const deviceType = useDetectDeviceType();
  const [showSwitchDeviceInstructions, setShowSwitchDeviceInstructions] =
    useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isLoadingQRCode, setIsLoadingQRCode] = useState(true);
  const {
    isSubscribed,
    setIsSubscribed,
    isCheckingSubscription,
    pushPermission,
    isSubscriptionLoading,
    setIsSubscriptionLoading,
    requestNotificationPermission
  } = useContext(NotificationContext);
  const { isPWA } = useContext(AppContext);

  useEffect(() => {
    if (!$visible && contentRef.current) {
      const timeoutId = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [$visible]);

  useEffect(() => {
    if ($visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [$visible]);

  useEffect(() => {
    const handleResize = () => {
      setIsResizing(true);
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (showSwitchDeviceInstructions) {
      fetch(
        `${process.env.REACT_APP_API_URL}/generate-qr-code/${groupId}/${user.id}`
      )
        .then((response) => response.url)
        .then((url) => {
          const img = new Image();
          img.onload = () => {
            setQrCodeUrl(url);
            setIsLoadingQRCode(false);
          };
          img.src = url;
        })
        .catch((error) => {
          console.error("Error fetching QR code:", error);
          setIsLoadingQRCode(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSwitchDeviceInstructions]);

  const initalizePushNotifications = async () => {
    try {
      if (isSubscribed) {
        // If already subscribed, unsubscribe
        console.log("Disabling push notifications...");
        await requestPushSubscription(
          groupId,
          user.id,
          pushPermission,
          setIsSubscribed,
          setIsSubscriptionLoading,
          true // Pass true for unsubscribe
        );
      } else {
        console.log("Starting push notification initialization...");
        const permission = await requestNotificationPermission();
        console.log("Permission response:", permission);

        if (permission === "granted") {
          console.log("Permission granted, requesting subscription...");
          await requestPushSubscription(
            groupId,
            user.id,
            permission,
            setIsSubscribed,
            setIsSubscriptionLoading,
            false // Pass false for subscribe
          );
        } else {
          console.log("Permission not granted:", permission);
        }
      }
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const sendTestNotification = async () => {
    console.log("Sending test notification...");
    await fetch(
      `${process.env.REACT_APP_API_URL}/web-push/send-test/${groupId}/${user.id}`
    );
    console.log("Test notification sent");
  };

  return (
    <Container $visible={$visible} $isResizing={isResizing} $isPWA={isPWA}>
      <Header>
        <HeaderContent
          $justifyContent={
            showSwitchDeviceInstructions ? "flex-start" : "space-between"
          }
        >
          {showSwitchDeviceInstructions && (
            <Button
              $type="icon-small"
              $size="large"
              $stretch="fit"
              $prominence="tertiary"
              $icon={faArrowLeft}
              onClick={() => setShowSwitchDeviceInstructions(false)}
              style={{ marginLeft: "-1.25rem" }}
            />
          )}
          <GroupTitle>
            {showSwitchDeviceInstructions
              ? `Login on a ${deviceType === "mobile" ? "computer" : "phone"}`
              : groupId}
          </GroupTitle>
          {!showSwitchDeviceInstructions && (
            <Button
              $type="icon-small"
              $size="large"
              $stretch="fit"
              $prominence="tertiary"
              $icon={faXmark}
              onClick={() => setIsMoreMenuVisible(false)}
              style={{ marginRight: "-1.25rem" }}
            />
          )}
        </HeaderContent>
        <HeaderShadow />
      </Header>
      <Content ref={contentRef}>
        {(groupId === "LOCALHOST" || groupId === "LEOTEST") && (
          <Section style={{ paddingBottom: "1rem" }}>
            <ListItem>
              Permission: {pushPermission.toUpperCase()}
              <br />
              Subscription:{" "}
              {isSubscriptionLoading ? "..." : isSubscribed ? "YES" : "NO"}
              <br />
              <br />
              <Button
                $type="text"
                $size="small"
                $stretch="fill"
                $isLoading={isCheckingSubscription || isSubscriptionLoading}
                $label={
                  isCheckingSubscription
                    ? "Checking notifications..."
                    : isSubscribed
                    ? "Disable push notifications"
                    : "Enable push notifications"
                }
                onClick={initalizePushNotifications}
                disabled={isCheckingSubscription}
              />
              {isSubscribed && (
                <>
                  <br />
                  <Button
                    $type="text"
                    $size="small"
                    $stretch="fill"
                    $label="Send test notification"
                    onClick={sendTestNotification}
                  />
                </>
              )}
            </ListItem>
          </Section>
        )}
        {showSwitchDeviceInstructions ? (
          <>
            {deviceType === "mobile" ? (
              <>
                <Section>
                  <SectionHeader>
                    <SectionLabel>Step 1</SectionLabel>
                  </SectionHeader>
                  <ListItem>
                    <ListItemContent style={{ padding: "0" }}>
                      <ListItemLabel>
                        Go to <b>wave.leo.gd/scan</b> on your computer
                      </ListItemLabel>
                    </ListItemContent>
                  </ListItem>
                </Section>
                <Section>
                  <SectionHeader>
                    <SectionLabel>Step 2</SectionLabel>
                  </SectionHeader>
                  <ListItem>
                    <ListItemContent style={{ padding: "0" }}>
                      <ListItemLabel>Scan this QR code</ListItemLabel>
                    </ListItemContent>
                  </ListItem>
                </Section>
              </>
            ) : (
              <>
                <Section>
                  <ListItem>
                    <ListItemContent
                      style={{ padding: "0", marginTop: "-1.5rem" }}
                    >
                      <ListItemLabel>
                        Use your phone to scan this QR code
                      </ListItemLabel>
                    </ListItemContent>
                  </ListItem>
                </Section>
              </>
            )}
            <Section>
              <ListItem>
                <ListItemContent style={{ padding: "0" }}>
                  <QRCodeContainer>
                    {isLoadingQRCode ? (
                      <Spinner $size="x-large" />
                    ) : (
                      qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt={`${process.env.REACT_APP_API_URL}/${groupId}/${user.id}`}
                        />
                      )
                    )}
                  </QRCodeContainer>
                </ListItemContent>
              </ListItem>
            </Section>
          </>
        ) : (
          <>
            <Section>
              <SectionHeader>
                <SectionLabel>Stats</SectionLabel>
                {statsIsLoading && <Spinner $size="small" />}
              </SectionHeader>
              <List>
                {config.createdAt && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Created</ListItemLabel>
                      <ListItemValue>
                        {formatDateTime(config.createdAt)}
                      </ListItemValue>
                    </ListItemContent>
                    <Separator />
                  </ListItem>
                )}
                {"userCount" in stats && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Members</ListItemLabel>
                      <ListItemValue>{stats.userCount}</ListItemValue>
                    </ListItemContent>
                    <Separator />
                  </ListItem>
                )}
                {"mediaCount" in stats && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Total Posts</ListItemLabel>
                      <ListItemValue>{stats.mediaCount}</ListItemValue>
                    </ListItemContent>
                    <Separator />
                  </ListItem>
                )}
                {"totalReactions" in stats && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Total Reactions</ListItemLabel>
                      <ListItemValue>{stats.totalReactions}</ListItemValue>
                    </ListItemContent>
                    <Separator />
                  </ListItem>
                )}
                {"topReactions" in stats && stats.topReactions.length > 0 && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Top Reactions</ListItemLabel>
                      <ListItemValue>
                        {stats.topReactions.map((reaction) => (
                          <Reaction
                            key={reaction.reaction}
                            reaction={reaction.reaction}
                            count={reaction.count}
                          />
                        ))}
                      </ListItemValue>
                    </ListItemContent>
                    <Separator />
                  </ListItem>
                )}
                {"totalComments" in stats && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Total Comments</ListItemLabel>
                      <ListItemValue>{stats.totalComments}</ListItemValue>
                    </ListItemContent>
                  </ListItem>
                )}
              </List>
            </Section>
            <Section style={{ paddingBottom: "1rem" }}>
              <ListItem>
                <Button
                  $type="text"
                  $size="small"
                  $stretch="fill"
                  $label={`Login on a ${
                    deviceType === "mobile" ? "computer" : "phone"
                  }`}
                  onClick={() => setShowSwitchDeviceInstructions(true)}
                />
              </ListItem>
            </Section>
            <Section>
              <SectionLabel>Members</SectionLabel>
              <List style={{ paddingTop: "0.5rem" }}>
                {users.map((user, index) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    showSeparator={index !== users.length - 1}
                  />
                ))}
              </List>
            </Section>
          </>
        )}
      </Content>
    </Container>
  );
};
