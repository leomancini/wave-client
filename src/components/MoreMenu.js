import styled from "styled-components";
import { useState, useRef, useEffect, memo, useCallback } from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";
import { Button } from "./Button";
import { Separator } from "./Separator";
import { Spinner } from "./Spinner";

const Container = memo(styled.div`
  position: absolute;
  top: 0;
  margin: 1.25rem 1rem 1rem 1rem;
  padding: 1rem;
  @media (hover: hover) and (pointer: fine) {
    padding-bottom: 1rem;
  }
  @media (hover: none) and (pointer: coarse) {
    padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
  }
  width: calc(100% - 2rem);
  max-width: 32rem;
  max-height: calc(100vh - 2rem);
  height: fit-content;
  min-height: calc(100vh - 2rem);
  background-color: white;
  z-index: 1000;
  pointer-events: none;

  transform: translate3d(calc(-100% - 2rem), 0, 0);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.16, 1.25, 0.3, 1),
    opacity 0.3s ease-out;

  @media (min-width: 32rem) {
    transform: translate3d(-50%, 0, 0);
    opacity: 0;
    transition: transform 0.6s cubic-bezier(0.16, 1.25, 0.3, 1),
      opacity 0.3s ease-out;
  }

  ${(props) =>
    props.$visible &&
    `
    pointer-events: auto;
    transform: translate3d(0, 0, 0);
    opacity: 1;

    @media (min-width: 32rem) {
      transform: translate3d(0, 0, 0);
      opacity: 1;
      transition: transform 0.6s cubic-bezier(0.16, 1.25, 0.3, 1),
        opacity 0.3s ease-out;
    }
  `}

  box-sizing: border-box;
  will-change: transform, opacity;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  perspective: 1000px;
  -webkit-font-smoothing: antialiased;

  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);

  border-bottom-left-radius: 0;
  border-top-left-radius: 2rem;
  border-bottom-right-radius: 0;
  border-top-right-radius: 2rem;

  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
`);

const staticStyledComponents = {
  Header: styled.div`
    padding: 0.5rem 0.5rem 1rem 0.5rem;
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
  `,
  HeaderShadow: styled.div`
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
  `,
  CloseButton: styled.div`
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.5rem;
    z-index: 2;
  `,
  Content: styled.div`
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    @media (hover: hover) and (pointer: fine) {
      padding-bottom: 1rem;
    }
    @media (hover: none) and (pointer: coarse) {
      padding-bottom: 4rem;
    }
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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
  `,
  Section: styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `,
  SectionHeader: styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  `,
  SectionLabel: styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.5);
    letter-spacing: 0.05rem;
    flex: 1;
  `,
  List: styled.div`
    display: flex;
    flex-direction: column;
  `,
  ListItem: styled.div`
    width: 100%;
  `,
  ListItemContent: styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 3rem;
    padding: 0.5rem 0;
  `,
  ListItemLabel: styled.div`
    font-size: 1rem;
  `,
  ListItemValue: styled.div`
    font-size: 1rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 1rem;
  `,
  UserAvatar: styled.div`
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
  `,
  Reaction: styled.div`
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
  `,
  ReactionEmoji: styled.div`
    font-size: 1.25rem;
  `
};

const MemoizedReaction = memo(({ reaction, count }) => (
  <staticStyledComponents.Reaction key={reaction}>
    <staticStyledComponents.ReactionEmoji>
      {reaction}
    </staticStyledComponents.ReactionEmoji>
    {count}
  </staticStyledComponents.Reaction>
));

const MemoizedUserListItem = memo(({ user, showSeparator }) => (
  <staticStyledComponents.ListItem>
    <staticStyledComponents.ListItemContent>
      <staticStyledComponents.ListItemValue>
        <staticStyledComponents.UserAvatar>
          {user.name.substring(0, 1).toUpperCase()}
        </staticStyledComponents.UserAvatar>
        {user.name}
      </staticStyledComponents.ListItemValue>
    </staticStyledComponents.ListItemContent>
    {showSeparator && <Separator />}
  </staticStyledComponents.ListItem>
));

export const MoreMenu = memo(
  ({
    $visible,
    setIsMoreMenuVisible,
    groupId,
    users,
    stats,
    statsIsLoading
  }) => {
    const { config } = useConfig();
    const [scrollPosition, setScrollPosition] = useState(0);
    const contentRef = useRef(null);

    const handleScroll = useCallback((e) => {
      setScrollPosition(e.target.scrollTop);
    }, []);

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

    const handleClose = useCallback(() => {
      setIsMoreMenuVisible(false);
    }, [setIsMoreMenuVisible]);

    return (
      <Container $visible={$visible}>
        <staticStyledComponents.Header>
          {groupId}
          <staticStyledComponents.HeaderShadow
            scrollPosition={scrollPosition}
          />
        </staticStyledComponents.Header>
        <staticStyledComponents.CloseButton>
          <Button
            $type="icon-small"
            $size="large"
            $stretch="fit"
            $prominence="tertiary"
            $icon={faXmark}
            onClick={handleClose}
          />
        </staticStyledComponents.CloseButton>
        <staticStyledComponents.Content
          onScroll={handleScroll}
          ref={contentRef}
        >
          <staticStyledComponents.Section>
            <staticStyledComponents.SectionHeader>
              <staticStyledComponents.SectionLabel>
                Stats
              </staticStyledComponents.SectionLabel>
              {statsIsLoading && <Spinner $size="small" />}
            </staticStyledComponents.SectionHeader>
            <staticStyledComponents.List>
              {config.createdAt && (
                <staticStyledComponents.ListItem>
                  <staticStyledComponents.ListItemContent>
                    <staticStyledComponents.ListItemLabel>
                      Created
                    </staticStyledComponents.ListItemLabel>
                    <staticStyledComponents.ListItemValue>
                      {formatDateTime(config.createdAt)}
                    </staticStyledComponents.ListItemValue>
                  </staticStyledComponents.ListItemContent>
                  <Separator />
                </staticStyledComponents.ListItem>
              )}
              {"userCount" in stats && (
                <staticStyledComponents.ListItem>
                  <staticStyledComponents.ListItemContent>
                    <staticStyledComponents.ListItemLabel>
                      Members
                    </staticStyledComponents.ListItemLabel>
                    <staticStyledComponents.ListItemValue>
                      {stats.userCount}
                    </staticStyledComponents.ListItemValue>
                  </staticStyledComponents.ListItemContent>
                  <Separator />
                </staticStyledComponents.ListItem>
              )}
              {"mediaCount" in stats && (
                <staticStyledComponents.ListItem>
                  <staticStyledComponents.ListItemContent>
                    <staticStyledComponents.ListItemLabel>
                      Total Posts
                    </staticStyledComponents.ListItemLabel>
                    <staticStyledComponents.ListItemValue>
                      {stats.mediaCount}
                    </staticStyledComponents.ListItemValue>
                  </staticStyledComponents.ListItemContent>
                  <Separator />
                </staticStyledComponents.ListItem>
              )}
              {"totalReactions" in stats && (
                <staticStyledComponents.ListItem>
                  <staticStyledComponents.ListItemContent>
                    <staticStyledComponents.ListItemLabel>
                      Total Reactions
                    </staticStyledComponents.ListItemLabel>
                    <staticStyledComponents.ListItemValue>
                      {stats.totalReactions}
                    </staticStyledComponents.ListItemValue>
                  </staticStyledComponents.ListItemContent>
                  <Separator />
                </staticStyledComponents.ListItem>
              )}
              {"topReactions" in stats && stats.topReactions.length > 0 && (
                <staticStyledComponents.ListItem>
                  <staticStyledComponents.ListItemContent>
                    <staticStyledComponents.ListItemLabel>
                      Top Reactions
                    </staticStyledComponents.ListItemLabel>
                    <staticStyledComponents.ListItemValue>
                      {stats.topReactions.map((reaction) => (
                        <MemoizedReaction
                          key={reaction.reaction}
                          reaction={reaction.reaction}
                          count={reaction.count}
                        />
                      ))}
                    </staticStyledComponents.ListItemValue>
                  </staticStyledComponents.ListItemContent>
                  <Separator />
                </staticStyledComponents.ListItem>
              )}
              {"totalComments" in stats && (
                <staticStyledComponents.ListItem>
                  <staticStyledComponents.ListItemContent>
                    <staticStyledComponents.ListItemLabel>
                      Total Comments
                    </staticStyledComponents.ListItemLabel>
                    <staticStyledComponents.ListItemValue>
                      {stats.totalComments}
                    </staticStyledComponents.ListItemValue>
                  </staticStyledComponents.ListItemContent>
                </staticStyledComponents.ListItem>
              )}
            </staticStyledComponents.List>
          </staticStyledComponents.Section>
          <staticStyledComponents.Section>
            <staticStyledComponents.SectionLabel>
              Members
            </staticStyledComponents.SectionLabel>
            <staticStyledComponents.List style={{ paddingTop: "0.5rem" }}>
              {users.map((user, index) => (
                <MemoizedUserListItem
                  key={user.id}
                  user={user}
                  showSeparator={index !== users.length - 1}
                />
              ))}
            </staticStyledComponents.List>
          </staticStyledComponents.Section>
        </staticStyledComponents.Content>
      </Container>
    );
  }
);
