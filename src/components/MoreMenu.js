import { useState, useRef, useEffect, useContext } from "react";
import styled from "styled-components";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import { NotificationContext, AppContext } from "../App";
import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";
import { useDetectDeviceType } from "../utilities/detectDeviceType";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faArrowLeft,
  faCheck
} from "@fortawesome/free-solid-svg-icons";

import { Button } from "./Button";
import { Separator } from "./Separator";
import { Spinner } from "./Spinner";
import VerifyPhoneNumber from "./VerifyPhoneNumber";
import { SegmentedController } from "./SegmentedController";
import { InlineEmptyCard } from "./EmptyCard";
import { UserAvatar } from "./UserAvatar";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemLabel,
  ListItemValue
} from "./List";
import { TextField } from "./TextField";

const Container = styled.div`
  position: fixed;
  top: 0;
  padding-bottom: ${(props) =>
    props.isPWA ? "0" : "env(safe-area-inset-bottom)"};
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
    props.isResizing ? "none" : "transform 0.4s ease-in-out"};
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  opacity: 1;
  visibility: visible;

  @media (min-width: 32rem) {
    opacity: 0;
    visibility: hidden;
    transform: translate3d(-4rem, 0, 0);
    transition: ${(props) =>
      props.isResizing
        ? "none"
        : "transform 0.4s ease-in-out, opacity 0.3s ease-out, visibility 0s linear 0.4s"};
    box-shadow: unset;
    padding-left: 3rem;
    padding-right: 3rem;

    width: calc(100% + 6rem);
    max-width: calc(32rem + 6rem);
  }

  ${(props) =>
    props.visible &&
    `
    pointer-events: auto;
    transform: translate3d(0, 0, 0);
    transition: ${props.isResizing ? "none" : "transform 0.4s ease-in-out"};

    @media (min-width: 32rem) {
      transform: translate3d(0, 0, 0);
      opacity: 1;
      visibility: visible;
      transition: ${
        props.isResizing
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
  justify-content: ${(props) => props.justifyContent};
  width: 100%;
`;

const Title = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
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
  padding-bottom: calc(2rem + env(safe-area-inset-bottom));
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  background-color: white;
  gap: 2.5rem;
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
  gap: 1.5rem;
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

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0;
  margin-bottom: 2rem;
  border-radius: 2rem;

  img {
    width: calc(100% - 4rem);
    height: calc(100% - 4rem);
  }
`;

const EmojiPickerContainer = styled.div`
  em-emoji-picker {
    width: 100%;
    min-width: 100%;
    box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
    --border-radius: 1rem;
    --rgb-accent: 0, 0, 0;
  }
`;

const ReactionButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 0;
  min-height: 2.75rem;
`;

const ReactionButton = styled.button`
  flex: 1 1 0;
  min-width: 0;
  max-width: calc((100% - 1.5rem) / 3);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0.5rem;
  text-align: center;
  outline: none;
  border: none;
  background-color: white;
  border-radius: 1.375rem;
  font-size: 1.25rem;
  height: 2.75rem;
  line-height: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  transform-origin: center center;
  will-change: transform;
  perspective: 1000;
  -webkit-perspective: 1000;
  box-sizing: border-box;
  user-select: none;
  border: 2px dashed rgba(0, 0, 0, 0.1);

  @media (hover: hover) {
    &:hover:not(:disabled) {
      border-color: rgba(0, 0, 0, 0.15);
      background-color: rgba(0, 0, 0, 0.05);
      outline: none;
    }
  }

  &:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(0.9) translateZ(0);
    backface-visibility: hidden;
  }

  ${(props) =>
    props.selected &&
    `
      border-style: solid;
      border-color: rgba(0, 0, 0, 0.5);
      background-color: rgba(0, 0, 0, 0.05);

      @media (hover: hover) {
        &:hover:not(:disabled) {
          border-color: rgba(0, 0, 0, 0.5);
          background-color: rgba(0, 0, 0, 0.05);
        }
      }

      &:active:not(:disabled) {
        border-color: rgba(0, 0, 0, 0.5);
      }
  `}

  &:disabled {
    opacity: 0.65;
    background: white;
    cursor: not-allowed;
    color: inherit;
  }
`;

const Reaction = ({ reaction, count }) => (
  <StyledReaction>
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

export const MoreMenu = ({
  visible,
  setIsMoreMenuVisible,
  groupId,
  users,
  user,
  stats,
  statsIsLoading,
  onNotificationPreferenceChange,
  onUserUpdate
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
  const [reactionEmojis, setReactionEmojis] = useState([]);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [reactionEmojiSlotIndex, setReactionEmojiSlotIndex] = useState(null);
  const [reactionEmojisLoading, setReactionEmojisLoading] = useState(true);
  const [notificationPreference, setNotificationPreference] = useState(null);
  const [
    isSwitchingNotificationPreference,
    setIsSwitchingNotificationPreference
  ] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const {
    isCheckingSubscription,
    pushPermission,
    isSubscriptionLoading,
    setIsSubscriptionLoading,
    setupPushNotifications,
    unsubscribePushNotifications,
    checkSubscriptionStatus,
    localPushNotificationsEnabled,
    setLocalPushNotificationsEnabled,
    isSettingUpPushNotifications
  } = useContext(NotificationContext);
  const { isPWA } = useContext(AppContext);
  const allowPushNotifications =
    isPWA || process.env.REACT_APP_ENVIRONMENT === "development";

  const handleSwitchNotificationPreference = async (option) => {
    const selectedOption = option.toUpperCase();
    if (selectedOption === notificationPreference) {
      return;
    }
    setIsSwitchingNotificationPreference(true);

    try {
      if (selectedOption === "PUSH") {
        if (allowPushNotifications) {
          await setupPushNotifications(groupId, user.id);
        } else {
          setIsSubscriptionLoading(false);
        }
      } else {
        await unsubscribePushNotifications(groupId, user.id);
        await fetch(
          `${process.env.REACT_APP_API_URL}/web-push/remove-subscription/${groupId}/${user.id}`,
          {
            method: "POST"
          }
        );
      }

      await fetch(
        `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}/notification-preference`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            notificationType: selectedOption
          })
        }
      );

      setNotificationPreference(selectedOption);
      if (onNotificationPreferenceChange) {
        onNotificationPreferenceChange(selectedOption);
      }

      if (selectedOption !== "PUSH" || !allowPushNotifications) {
        setIsSubscriptionLoading(false);
      }
    } catch (error) {
      console.error("Error updating notification preference:", error);
      setIsSubscriptionLoading(false);
    }

    setIsSwitchingNotificationPreference(false);
  };

  useEffect(() => {
    if (config?.reactions) {
      setReactionEmojis(config.reactions);
      setReactionEmojisLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!visible && contentRef.current) {
      const timeoutId = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [visible]);

  useEffect(() => {
    if (showSwitchDeviceInstructions && contentRef.current) {
      const originalScrollBehavior = contentRef.current.style.scrollBehavior;
      contentRef.current.style.scrollBehavior = "auto";
      contentRef.current.scrollTop = 0;
      contentRef.current.style.scrollBehavior = originalScrollBehavior;
    }
  }, [showSwitchDeviceInstructions]);

  useEffect(() => {
    if (visible) {
      const scrollPos = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollPos}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [visible]);

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

  useEffect(() => {
    if (!visible || !allowPushNotifications) return;
    checkSubscriptionStatus();
  }, [visible, allowPushNotifications, checkSubscriptionStatus]);

  useEffect(() => {
    if (!visible) return;
    if (notificationPreference === null) {
      const serverPreference = user.notificationPreference || "OFF";
      if (
        serverPreference === "PUSH" &&
        allowPushNotifications &&
        pushPermission === "denied"
      ) {
        fetch(
          `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}/notification-preference`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              notificationType: "OFF"
            })
          }
        );
        setNotificationPreference("OFF");
        if (onNotificationPreferenceChange) {
          onNotificationPreferenceChange("OFF");
        }
      } else {
        setNotificationPreference(serverPreference);
        if (onNotificationPreferenceChange) {
          onNotificationPreferenceChange(serverPreference);
        }
      }
    }
  }, [
    visible,
    user.notificationPreference,
    notificationPreference,
    pushPermission,
    groupId,
    user.id,
    allowPushNotifications,
    onNotificationPreferenceChange
  ]);

  useEffect(() => {
    setLocalPushNotificationsEnabled(user.pushNotificationsEnabled);
  }, [user.pushNotificationsEnabled, setLocalPushNotificationsEnabled]);

  const showInvitationShareSheet = () => {
    navigator
      .share({
        title: `Join me in (WAVE)${groupId}`,
        url: `${process.env.REACT_APP_CLIENT_URL}/${groupId}/join`
      })
      .catch((error) => console.error("Error sharing:", error));
  };

  const handleEmojiSelect = async (emoji) => {
    const updatedEmojis = [...reactionEmojis];
    updatedEmojis[reactionEmojiSlotIndex] = emoji.native;
    setReactionEmojis(updatedEmojis);
    setEmojiPickerVisible(false);
    setReactionEmojisLoading(true);
    setReactionEmojiSlotIndex(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/update-reaction-emojis/${groupId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ emojis: updatedEmojis })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update reactions");
      }

      config.reactions = updatedEmojis;
    } catch (error) {
      console.error("Error updating reaction emojis:", error);
      setReactionEmojiSlotIndex(reactionEmojiSlotIndex);
      setReactionEmojisLoading(false);
      setEmojiPickerVisible(true);
    } finally {
      setReactionEmojisLoading(false);
      setReactionEmojiSlotIndex(null);
    }
  };

  return (
    <Container visible={visible} isResizing={isResizing} isPWA={isPWA}>
      <Header>
        <HeaderContent
          justifyContent={
            showSwitchDeviceInstructions ? "flex-start" : "space-between"
          }
        >
          {showSwitchDeviceInstructions && (
            <Button
              type="icon-small"
              size="large"
              stretch="fit"
              prominence="tertiary"
              icon={faArrowLeft}
              onClick={() => setShowSwitchDeviceInstructions(false)}
              style={{ marginLeft: "-1.25rem" }}
            />
          )}
          <Title>
            {showSwitchDeviceInstructions
              ? `Login on a ${deviceType === "mobile" ? "computer" : "phone"}`
              : groupId}
          </Title>
          {!showSwitchDeviceInstructions && (
            <Button
              type="icon-small"
              size="large"
              stretch="fit"
              prominence="tertiary"
              icon={faXmark}
              onClick={() => setIsMoreMenuVisible(false)}
              style={{ marginRight: "-1.25rem" }}
            />
          )}
        </HeaderContent>
        <HeaderShadow />
      </Header>
      <Content ref={contentRef}>
        {showSwitchDeviceInstructions ? (
          <>
            {deviceType === "mobile" ? (
              <>
                <Section style={{ gap: "1rem" }}>
                  <SectionHeader>
                    <SectionLabel>Step 1</SectionLabel>
                  </SectionHeader>
                  <ListItem>
                    <ListItemContent style={{ padding: "0", minHeight: "0" }}>
                      <ListItemLabel>
                        Go to <b>wave.leo.gd/scan</b> on your computer
                      </ListItemLabel>
                    </ListItemContent>
                  </ListItem>
                </Section>
                <Section style={{ gap: "1rem" }}>
                  <SectionHeader>
                    <SectionLabel>Step 2</SectionLabel>
                  </SectionHeader>
                  <ListItem>
                    <ListItemContent style={{ padding: "0", minHeight: "0" }}>
                      <ListItemLabel>Scan this QR code</ListItemLabel>
                    </ListItemContent>
                  </ListItem>
                </Section>
              </>
            ) : (
              <>
                <Section style={{ gap: "1rem" }}>
                  <ListItem>
                    <ListItemContent
                      style={{
                        padding: "0",
                        marginTop: "-1.5rem",
                        minHeight: "0"
                      }}
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
                      <Spinner size="x-large" />
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
                <SectionLabel>Reactions</SectionLabel>
                {reactionEmojisLoading && <Spinner size="small" />}
              </SectionHeader>
              <SectionContent>
                <ReactionButtons>
                  {reactionEmojis?.map((reaction, index) => (
                    <ReactionButton
                      key={`reaction-emoji-slot-${index}-${reaction}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index !== reactionEmojiSlotIndex) {
                          setEmojiPickerVisible(true);
                          setReactionEmojiSlotIndex(index);
                        } else {
                          setEmojiPickerVisible(false);
                          setReactionEmojiSlotIndex(null);
                        }
                      }}
                      disabled={reactionEmojisLoading}
                      selected={index === reactionEmojiSlotIndex}
                    >
                      {reaction}
                    </ReactionButton>
                  ))}
                </ReactionButtons>
                {emojiPickerVisible && (
                  <EmojiPickerContainer>
                    <Picker
                      data={data}
                      dynamicWidth={true}
                      theme="light"
                      previewPosition="none"
                      maxFrequentRows="0"
                      emojiSize={32}
                      emojiButtonSize={48}
                      emojiButtonRadius="0.5rem"
                      searchPosition="static"
                      onEmojiSelect={handleEmojiSelect}
                      onClickOutside={() => {
                        setEmojiPickerVisible(false);
                        setReactionEmojiSlotIndex(null);
                      }}
                    />
                  </EmojiPickerContainer>
                )}
              </SectionContent>
            </Section>
            <Section>
              <SectionHeader>
                <SectionLabel>Notifications</SectionLabel>
                {(isSwitchingNotificationPreference ||
                  isCheckingSubscription ||
                  isSubscriptionLoading ||
                  isSettingUpPushNotifications) && <Spinner size="small" />}
              </SectionHeader>
              <SegmentedController
                options={["Off", "Push", "SMS"]}
                selectedOption={notificationPreference}
                setSelectedOption={handleSwitchNotificationPreference}
                isLoading={
                  isCheckingSubscription ||
                  isSubscriptionLoading ||
                  isSwitchingNotificationPreference ||
                  isSettingUpPushNotifications
                }
              />

              {!isSwitchingNotificationPreference && (
                <>
                  {notificationPreference === "PUSH" && (
                    <>
                      {allowPushNotifications ? (
                        pushPermission === "denied" ? (
                          <InlineEmptyCard>
                            Push notifications blocked, check browser settings.
                          </InlineEmptyCard>
                        ) : (
                          !localPushNotificationsEnabled && (
                            <Button
                              type="text"
                              size="small"
                              prominence="secondary"
                              stretch="fill"
                              label="Enable push notifications"
                              onClick={() =>
                                setupPushNotifications(groupId, user.id)
                              }
                              disabled={
                                isSettingUpPushNotifications ||
                                isSubscriptionLoading ||
                                isCheckingSubscription
                              }
                            />
                          )
                        )
                      ) : (
                        !localPushNotificationsEnabled && (
                          <>
                            <InlineEmptyCard>
                              To enable push notifications,
                              <br />
                              {deviceType === "mobile"
                                ? "add WAVE to your home screen."
                                : "open WAVE on your phone."}
                            </InlineEmptyCard>
                            {deviceType !== "mobile" && (
                              <Button
                                type="text"
                                size="small"
                                prominence="secondary"
                                label={`Login on a ${
                                  deviceType === "mobile" ? "computer" : "phone"
                                }`}
                                onClick={() =>
                                  setShowSwitchDeviceInstructions(true)
                                }
                              />
                            )}
                          </>
                        )
                      )}
                    </>
                  )}
                  {notificationPreference === "SMS" && (
                    <VerifyPhoneNumber groupId={groupId} user={user} />
                  )}
                </>
              )}
            </Section>
            <Section>
              <SectionHeader>
                <SectionLabel>Stats</SectionLabel>
                {statsIsLoading && <Spinner size="small" />}
              </SectionHeader>
              <List>
                {config?.createdAt && (
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
                        {stats.topReactions.map((reaction, index) => (
                          <Reaction
                            key={`top-reaction-${index}`}
                            reaction={reaction.reaction}
                            count={reaction.count}
                            index={index}
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
            <Section>
              <SectionHeader>
                <SectionLabel>Members</SectionLabel>
              </SectionHeader>
              <List style={{ paddingTop: "0.5rem" }}>
                {users.map((user, index) => (
                  <UserListItem
                    key={`user-${index}`}
                    user={user}
                    showSeparator={index !== users.length - 1}
                  />
                ))}
              </List>
              {navigator.share && (
                <Button
                  type="text"
                  size="small"
                  prominence="primary"
                  stretch="fill"
                  label={`Invite someone`}
                  onClick={showInvitationShareSheet}
                />
              )}
            </Section>
            <Section>
              <SectionHeader>
                <SectionLabel>Settings</SectionLabel>
              </SectionHeader>
              <ListItem>
                <TextField
                  label="Name"
                  initialValue={user.name}
                  buttonLabel={<FontAwesomeIcon icon={faCheck} />}
                  isLoading={isUpdatingUsername}
                  disabled={isUpdatingUsername}
                  onSubmit={async (newName) => {
                    if (!newName || newName === user.name) return;
                    setIsUpdatingUsername(true);
                    try {
                      const response = await fetch(
                        `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: newName })
                        }
                      );
                      if (!response.ok)
                        throw new Error("Failed to update username");
                      const data = await response.json();
                      if (data.success && data.user) {
                        if (typeof user === "object")
                          user.name = data.user.name;
                      }
                      if (onUserUpdate) {
                        onUserUpdate(data.user);
                      }
                    } catch (e) {
                      alert("Failed to update username. Please try again.");
                    } finally {
                      setIsUpdatingUsername(false);
                    }
                  }}
                  maxLength={32}
                  clearValueOnSubmit={false}
                />
              </ListItem>
              <ListItem>
                <Button
                  type="text"
                  size="small"
                  stretch="fill"
                  prominence="secondary"
                  label={`Login on a ${
                    deviceType === "mobile" ? "computer" : "phone"
                  }`}
                  onClick={() => setShowSwitchDeviceInstructions(true)}
                />
              </ListItem>
              <ListItem>
                <Button
                  type="text"
                  size="small"
                  stretch="fill"
                  prominence="destructive"
                  label="Delete my account"
                  isLoading={isDeletingAccount}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Are you sure you want to delete your account?"
                      )
                    )
                      return;
                    setIsDeletingAccount(true);
                    try {
                      const response = await fetch(
                        `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}`,
                        {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" }
                        }
                      );
                      if (!response.ok)
                        throw new Error("Failed to delete account");
                      const data = await response.json();
                      if (data.success) {
                        // Remove group from localStorage
                        try {
                          const myGroups = JSON.parse(
                            localStorage.getItem("myGroups") || "[]"
                          );
                          console.log("Current myGroups:", myGroups);
                          console.log(
                            "Looking to remove groupId:",
                            groupId,
                            "userId:",
                            user.id
                          );
                          console.log(
                            "groupId type:",
                            typeof groupId,
                            "user.id type:",
                            typeof user.id
                          );

                          const updatedGroups = myGroups.filter((group) => {
                            console.log(
                              "Checking group:",
                              group,
                              "group.groupId type:",
                              typeof group.groupId,
                              "group.userId type:",
                              typeof group.userId
                            );
                            const shouldKeep = !(
                              group.groupId === groupId &&
                              group.userId === user.id
                            );
                            console.log("Should keep this group:", shouldKeep);
                            return shouldKeep;
                          });

                          console.log("Updated groups:", updatedGroups);
                          localStorage.setItem(
                            "myGroups",
                            JSON.stringify(updatedGroups)
                          );
                          console.log("localStorage updated successfully");

                          // Add a small delay to ensure localStorage is persisted
                          setTimeout(() => {
                            window.location.href = "/";
                          }, 100);
                        } catch (localStorageError) {
                          console.error(
                            "Error updating localStorage:",
                            localStorageError
                          );
                          window.location.href = "/";
                        }
                      } else {
                        alert("Sorry, something went wrong.");
                      }
                    } catch (e) {
                      alert("Sorry, something went wrong.");
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  }}
                />
              </ListItem>
            </Section>
          </>
        )}
      </Content>
    </Container>
  );
};
