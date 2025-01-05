import styled from "styled-components";
import { useState, useRef, useEffect } from "react";

import { faXmark, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";
import { Button } from "./Button";
import { Separator } from "./Separator";
import { Spinner } from "./Spinner";

const Container = styled.div`
  position: fixed;
  top: 0;
  padding-bottom: 0;
  width: 100%;
  max-width: 32rem;
  max-height: 100vh;
  height: fit-content;
  min-height: 100vh;
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
  padding-bottom: 1rem;
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
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

  @supports (-webkit-touch-callout: none) {
    padding-bottom: calc(6rem + env(safe-area-inset-bottom));
  }
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
  }, []);

  return isMobile;
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
  const isMobile = useIsMobile();
  const [showSwitchDeviceInstructions, setShowSwitchDeviceInstructions] =
    useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isLoadingQRCode, setIsLoadingQRCode] = useState(true);

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

  return (
    <Container $visible={$visible} $isResizing={isResizing}>
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
              ? `Login on a ${isMobile ? "computer" : "phone"}`
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
        {showSwitchDeviceInstructions ? (
          <>
            {isMobile ? (
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
                  $label={`Login on a ${isMobile ? "computer" : "phone"}`}
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
