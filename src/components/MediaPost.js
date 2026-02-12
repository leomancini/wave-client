import React, { useState, useEffect, useRef, forwardRef } from "react";
import styled from "styled-components";

import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";

import { Comments } from "./Comments";
import { PhotoGrid } from "./PhotoGrid";
import { Spinner } from "./Spinner";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  scroll-margin-top: 1.5rem;
  position: relative;

  p {
    margin: 0;
  }
`;

const Details = styled.div`
  height: 1.25rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 1rem;
  min-height: 1.25rem;
`;

const Name = styled.p`
  height: 1.25rem;
  font-weight: bold;
  padding-left: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  max-width: 100%;
`;

const MetadataAndActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 0.5rem;
  padding-right: 0.5rem;
`;

const Time = styled.p`
  height: 1.25rem;
  color: var(--color-text-muted);
  transition: color 1s;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;

  ${({ isUnread }) =>
    isUnread &&
    `
      color: var(--color-accent);
    `}
`;

const UnreadIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-accent);
  box-shadow: var(--color-accent-shadow);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 1s;
  margin-bottom: 0.375rem;

  ${({ visible }) =>
    visible &&
    `
      opacity: 1;
    `};
`;

const ShareButton = styled.button`
  border: none;
  font-size: 1rem;
  vertical-align: 2px;
  font-weight: 500;
  color: var(--color-share-btn);
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  transition: all 0.2s;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      color: var(--color-share-btn-hover);
    }
  }

  &:active:not(:disabled) {
    color: var(--color-share-btn-hover);
    transform: scale(0.9);
  }

  &:disabled {
    color: var(--color-share-btn-disabled);
    cursor: not-allowed;
  }
`;

const ReactionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 0.5rem;
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
`;

const Reactions = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  min-height: 1.25rem;
  padding: 0 0.5rem;

  ${({ isEmpty }) =>
    isEmpty &&
    `
      display: none;
    `}
`;

const Reaction = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  min-height: calc(1.25rem + 0.375rem);
`;

const ReactionEmoji = styled.div`
  font-size: 1.25rem;
  transition: opacity 0.2s;
`;

const ReactionSpinnerContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
`;

const AddReactionButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 0;
  height: 2.75rem;
  min-height: 2.75rem;
`;

const AddReactionButton = styled.button`
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
  background-color: var(--color-surface);
  border-radius: 1.375rem;
  font-size: 1.25rem;
  height: 2.75rem;
  min-height: 2.75rem;
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

  @media (hover: hover) {
    &:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
      outline: none;
    }
  }

  &:active:not(:disabled) {
    background-color: var(--color-surface-active);
    transform: scale(0.9) translateZ(0);
    backface-visibility: hidden;
  }

  &.selected {
    background-color: var(--color-reaction-selected-bg);
    box-shadow: var(--shadow-reaction-selected);

    @media (hover: hover) {
      &:hover {
        background-color: var(--color-reaction-selected-bg);
      }
    }

    &:active {
      background-color: var(--color-reaction-selected-bg);
    }
  }

  &:disabled {
    background: var(--color-reaction-btn-disabled-bg);
    cursor: not-allowed;

    ${ReactionEmoji} {
      opacity: 0.4;
    }
  }
`;

let lastClickTime = 0;
let lastTouchTime = 0;
let isPinching = false;

const handleDoubleClick = (
  e,
  postId,
  setReactions,
  { groupId, user, reaction }
) => {
  if (isPinching) {
    e.preventDefault();
    return;
  }

  if (e.touches && e.touches.length > 1) {
    e.preventDefault();
    isPinching = true;
    return;
  }

  const currentTime = new Date().getTime();
  const isTouch = e.type === "touchend";

  if (isTouch) {
    e.preventDefault();
    if (!isPinching && lastTouchTime && currentTime - lastTouchTime < 300) {
      addReaction(postId, setReactions, { groupId, user, reaction });
      lastTouchTime = 0;
    } else {
      lastTouchTime = currentTime;
    }
  } else {
    if (lastClickTime && currentTime - lastClickTime < 300) {
      addReaction(postId, setReactions, { groupId, user, reaction });
      lastClickTime = 0;
    } else {
      lastClickTime = currentTime;
    }
  }
};

const addReaction = async (
  postId,
  setReactions,
  { groupId, user, reaction }
) => {
  let isRemoving = false;

  setReactions((prevReactions) => {
    isRemoving = prevReactions.some(
      (r) => r.user.id === user.id && r.reaction === reaction
    );

    if (isRemoving) {
      return prevReactions.map((r) =>
        r.user.id === user.id && r.reaction === reaction
          ? { ...r, isPending: true }
          : r
      );
    } else {
      const filteredReactions = prevReactions.filter(
        (r) => r.user.id !== user.id
      );
      return [
        ...filteredReactions,
        {
          user,
          reaction,
          isPending: true
        }
      ];
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  if (!isRemoving) {
    const container = document.getElementById(postId);
    if (container) {
      const photoGrid = container.firstElementChild;
      if (photoGrid) {
        const tempReaction = document.createElement("div");
        tempReaction.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          margin-top: -2rem;
          font-size: 5rem;
          opacity: 0;
          pointer-events: none;
          z-index: 2;
          animation: reactionPopup 0.4s ease-out forwards,
            reactionFadeOut 0.5s ease-out 0.8s forwards;
        `;

        const style = document.createElement("style");
        style.textContent = `
          @keyframes reactionPopup {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
          @keyframes reactionFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `;
        document.head.appendChild(style);

        tempReaction.textContent = reaction;
        photoGrid.style.position = "relative";
        photoGrid.appendChild(tempReaction);

        setTimeout(() => {
          tempReaction.remove();
          style.remove();
        }, 2000);
      }
    }
  }

  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/media/${groupId}/post/${postId}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user.id,
          reaction
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add reaction");
    }

    setReactions((prevReactions) => {
      if (isRemoving) {
        return prevReactions.filter(
          (r) => !(r.user.id === user.id && r.reaction === reaction)
        );
      } else {
        const filteredReactions = prevReactions.filter(
          (r) => r.user.id !== user.id
        );
        return [
          ...filteredReactions,
          {
            user,
            reaction,
            isPending: false
          }
        ];
      }
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    alert("Failed to add reaction. Please try again.");
    setReactions((prevReactions) => {
      if (isRemoving) {
        return prevReactions.map((r) =>
          r.user.id === user.id && r.reaction === reaction
            ? { ...r, isPending: false }
            : r
        );
      } else {
        return prevReactions.filter((r) => r.user.id !== user.id);
      }
    });
  }
};

export const MediaPost = forwardRef(
  (
    {
      post,
      groupId,
      user,
      isUnread,
      onLoad,
      isUploadedThisPageLoad,
      isDoneUploading
    },
    ref
  ) => {
    const { config } = useConfig();
    const [reactions, setReactions] = useState(post.reactions || []);
    const [reactionEmojis, setReactionEmojis] = useState(config.reactions);
    const localRef = useRef(null);
    const observerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const mergeRefs = (node) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      localRef.current = node;
    };

    useEffect(() => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              onLoad(post.postId);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px",
          threshold: 1.0
        }
      );

      if (localRef.current) {
        observerRef.current.observe(localRef.current);
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [post.postId, onLoad]);

    useEffect(() => {
      setReactionEmojis(config.reactions);
    }, [config.reactions]);

    useEffect(() => {
      setReactions(post.reactions || []);
    }, [post.reactions]);

    const hasUserReaction = (reactionEmoji) => {
      return reactions.some(
        (r) => r.user.id === user.id && r.reaction === reactionEmoji
      );
    };

    const isPendingAny = reactions.some(
      (r) => r.user.id === user.id && r.isPending
    );

    const handleShare = async () => {
      try {
        if (navigator.share && navigator.canShare) {
          const files = await Promise.all(
            post.items.map(async (item, index) => {
              const mediaUrl = item.isUploadedThisPageLoad || isUploadedThisPageLoad
                ? item.localUrl
                : `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.metadata.itemId}`;
              const response = await fetch(mediaUrl);
              const blob = await response.blob();
              const suffix = post.items.length > 1 ? ` ${index + 1}` : "";
              const isVideoItem = item.metadata?.mediaType === "video";
              const ext = isVideoItem ? ".mp4" : ".jpg";
              const label = isVideoItem ? "Video" : "Photo";
              return new File(
                [blob],
                `${label}${suffix} from ${post.uploader?.name} in ${groupId}${ext}`,
                {
                  type: blob.type || (isVideoItem ? "video/mp4" : "image/jpeg")
                }
              );
            })
          );

          if (navigator.canShare({ files })) {
            await navigator.share({
              title: post.items.length > 1
                ? `Media from ${post.uploader?.name} in ${groupId}`
                : `${post.items[0]?.metadata?.mediaType === "video" ? "Video" : "Photo"} from ${post.uploader?.name} in ${groupId}`,
              files
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error sharing:", error);
      }
    };

    const getImageUrl = (item) => {
      if (item.isUploadedThisPageLoad || isUploadedThisPageLoad) {
        return item.localUrl;
      }
      return `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.metadata.itemId}`;
    };

    const getThumbnailUrl = (item) => {
      if (item.isUploadedThisPageLoad || isUploadedThisPageLoad) {
        return null;
      }
      return `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.metadata.itemId}/thumbnail`;
    };

    return (
      <Container id={post.postId} ref={mergeRefs}>
        <PhotoGrid
          items={post.items}
          postId={post.postId}
          groupId={groupId}
          isUploadedThisPageLoad={isUploadedThisPageLoad}
          isDoneUploading={isDoneUploading}
          onDoubleClick={(e) =>
            handleDoubleClick(e, post.postId, setReactions, {
              groupId,
              user,
              reaction: config.reactions[0]
            })
          }
          getImageUrl={getImageUrl}
          getThumbnailUrl={getThumbnailUrl}
        />
        <Details>
          <Name>{post.uploader?.name || user.name}</Name>
          <MetadataAndActions>
            {isUploadedThisPageLoad === undefined ||
            (isUploadedThisPageLoad && isDoneUploading) ? (
              <>
                <UnreadIndicator visible={isUnread} />
                <Time isUnread={isUnread} onClick={handleShare}>
                  {formatDateTime(post.uploadDate)}
                </Time>
              </>
            ) : (
              isUploadedThisPageLoad &&
              !isDoneUploading && <Time>Uploading...</Time>
            )}
            <ShareButton
              onClick={handleShare}
              disabled={isUploadedThisPageLoad && !isDoneUploading}
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </ShareButton>
          </MetadataAndActions>
        </Details>
        <ReactionsContainer>
          <Reactions isEmpty={Object.keys(reactions).length === 0}>
            {Object.entries(
              reactions.reduce((acc, reaction) => {
                if (!acc[reaction.reaction]) {
                  acc[reaction.reaction] = {
                    users: [],
                    isPending: reaction.isPending
                  };
                }
                acc[reaction.reaction].users.push(reaction.user.name);
                acc[reaction.reaction].isPending =
                  acc[reaction.reaction].isPending || reaction.isPending;
                return acc;
              }, {})
            ).map(([reaction, { users, isPending }], index) => (
              <Reaction key={`post-${post.postId}-reaction-${index}`}>
                <ReactionEmoji>{reaction}</ReactionEmoji>
                {users.join(", ")}
                {isPending && (
                  <ReactionSpinnerContainer>
                    <Spinner size="small" />
                  </ReactionSpinnerContainer>
                )}
              </Reaction>
            ))}
          </Reactions>
          <AddReactionButtons>
            {reactionEmojis?.map((reaction, index) => (
              <AddReactionButton
                key={`post-${post.postId}-add-reaction-${index}`}
                className={hasUserReaction(reaction) ? "selected" : ""}
                onClick={() =>
                  addReaction(post.postId, setReactions, {
                    groupId,
                    user,
                    reaction
                  })
                }
                disabled={
                  isPendingAny || (isUploadedThisPageLoad && !isDoneUploading)
                }
              >
                <ReactionEmoji>{reaction}</ReactionEmoji>
              </AddReactionButton>
            ))}
          </AddReactionButtons>
        </ReactionsContainer>
        <Comments
          postId={post.postId}
          post={post}
          groupId={groupId}
          user={user}
          disabled={isUploadedThisPageLoad && !isDoneUploading}
        />
      </Container>
    );
  }
);
