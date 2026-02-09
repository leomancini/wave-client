import React, { useState, useEffect, useRef, forwardRef } from "react";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { useConfig } from "../contexts/ConfigContext";
import { useDetectDeviceType } from "../utilities/detectDeviceType";

import { formatDateTime } from "../utilities/formatDateTime";

import { Comments } from "./Comments";
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

const Media = styled.div`
  position: relative;
  border-radius: 2rem;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0;
  background-color: rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  transition: opacity 0.5s, filter 0.5s, transform 0.5s;
  filter: blur(8px);
  transform: scale(1.125);
  transform-origin: center;
  opacity: ${({ isUploadedThisPageLoad }) =>
    isUploadedThisPageLoad ? 0.5 : 1};
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  will-change: transform;
  perspective: 1000;
  -webkit-perspective: 1000;
  box-sizing: border-box;
  user-select: none;

  ${({ isUploadedThisPageLoad, isDoneUploading, isImageLoaded }) => {
    const isVisible = isUploadedThisPageLoad ? isDoneUploading : isImageLoaded;
    return (
      isVisible &&
      `
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  `
    );
  }};
`;

const Image = styled.img`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const Thumbnail = styled.img`
  width: 100%;
  opacity: ${({ isThumbnailLoaded }) => (isThumbnailLoaded ? 1 : 0)};
  transition: opacity 0.2s;
`;

const ImageSpinnerContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
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
  color: rgba(0, 0, 0, 0.5);
  transition: color 1s;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;

  ${({ isUnread }) =>
    isUnread &&
    `
      color: rgba(0, 122, 255, 1);
    `}
`;

const UnreadIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  background-color: rgba(0, 122, 255, 1);
  box-shadow: 0px 0px 24px rgba(0, 122, 255, 0.5),
    0px 2px 4px rgba(0, 122, 255, 0.25);
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
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  transition: all 0.2s;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      color: rgba(0, 0, 0, 0.7);
    }
  }

  &:active:not(:disabled) {
    color: rgba(0, 0, 0, 0.7);
    transform: scale(0.9);
  }

  &:disabled {
    color: rgba(0, 0, 0, 0.3);
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
  background-color: rgba(0, 0, 0, 0.05);
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
      background-color: rgba(0, 0, 0, 0.075);
      outline: none;
    }
  }

  &:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(0.9) translateZ(0);
    backface-visibility: hidden;
  }

  &.selected {
    background-color: rgba(0, 0, 0, 0);
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1), 0px 1px 8px rgba(0, 0, 0, 0.15);

    @media (hover: hover) {
      &:hover {
        background-color: rgba(0, 0, 0, 0);
      }
    }

    &:active {
      background-color: rgba(0, 0, 0, 0);
    }
  }

  &:disabled {
    background: rgba(0, 0, 0, 0.025);
    cursor: not-allowed;

    ${ReactionEmoji} {
      opacity: 0.4;
    }
  }
`;

let lastClickTime = 0;
let lastTouchTime = 0;
let isPinching = false;

export const handleMediaItemClick = (
  e,
  itemId,
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
      addReaction(itemId, setReactions, { groupId, user, reaction });
      lastTouchTime = 0;
    } else {
      lastTouchTime = currentTime;
    }
  } else {
    if (lastClickTime && currentTime - lastClickTime < 300) {
      addReaction(itemId, setReactions, { groupId, user, reaction });
      lastClickTime = 0;
    } else {
      lastClickTime = currentTime;
    }
  }
};

const addReaction = async (
  itemId,
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
    const img = document.querySelector(`img[alt="${itemId}"]`) || document.querySelector(`video[data-item-id="${itemId}"]`);
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
    img.parentElement.style.position = "relative";
    img.parentElement.appendChild(tempReaction);

    setTimeout(() => {
      tempReaction.remove();
      style.remove();
    }, 2000);
  }

  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/media/${groupId}/${itemId}/reactions`,
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

export const MediaItem = forwardRef(
  (
    {
      item,
      imageUrl,
      thumbnailUrl,
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
    const deviceType = useDetectDeviceType();
    const isMobile = deviceType === "mobile";
    const [reactions, setReactions] = useState(item.reactions || []);
    const [touchStartY, setTouchStartY] = useState(null);
    const [isThumbnailLoaded, setIsThumbnailLoaded] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [reactionEmojis, setReactionEmojis] = useState(config.reactions);
    const scrollThreshold = 10;
    const localRef = useRef(null);
    const observerRef = useRef(null);
    const transformRef = useRef(null);

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
            if (entry.isIntersecting && isImageLoaded) {
              onLoad(item.metadata.itemId);
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
    }, [item.metadata.itemId, onLoad, isImageLoaded]);

    useEffect(() => {
      setReactionEmojis(config.reactions);
    }, [config.reactions]);

    useEffect(() => {
      // Keep local state in sync with item.reactions
      // when it changes on page visibility change
      setReactions(item.reactions || []);
    }, [item.reactions]);

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
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File(
            [blob],
            `Photo from ${item.uploader?.name} in ${groupId}.jpg`,
            {
              type: blob.type || "image/jpeg"
            }
          );

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Photo from ${item.uploader?.name} in ${groupId}`,
              files: [file]
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error sharing:", error);
      }
    };

    return (
      <Container id={item.metadata.itemId}>
        <Media
          ref={mergeRefs}
          style={{
            aspectRatio: `${item.metadata.dimensions?.width || 1} / ${
              item.metadata.dimensions?.height || 1
            }`,
            pointerEvents: isUploadedThisPageLoad ? "none" : "auto"
          }}
          onClick={(e) => {
            if (isUploadedThisPageLoad) return;
            if (!("ontouchstart" in window)) {
              handleMediaItemClick(e, item.metadata.itemId, setReactions, {
                groupId,
                user,
                reaction: config.reactions[0]
              });
            }
          }}
          onTouchStart={(e) => {
            setTouchStartY(e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (touchStartY === null) return;
            if (
              Math.abs(e.touches[0].clientY - touchStartY) > scrollThreshold
            ) {
              setTouchStartY(null);
            }
          }}
          onTouchEnd={(e) => {
            if (touchStartY !== null) {
              handleMediaItemClick(e, item.metadata.itemId, setReactions, {
                groupId,
                user,
                reaction: config.reactions[0]
              });
            }
            setTouchStartY(null);

            // Reset scale to 1 when touch ends
            if (transformRef.current) {
              transformRef.current.resetTransform();
            }
          }}
        >
          <TransformWrapper
            initialScale={1}
            minScale={1.4}
            maxScale={4}
            centerOnInit={true}
            doubleClick={{ disabled: true }}
            disabled={isUploadedThisPageLoad || !isMobile}
            ref={transformRef}
            limitToBounds={true}
            onZoomStop={({ scale }) => {
              if (
                scale < 1 &&
                transformRef.current &&
                typeof transformRef.current.setScale === "function"
              ) {
                transformRef.current.setScale(1);
              }
            }}
            panning={{ disabled: true }}
          >
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%"
              }}
              contentStyle={{
                width: "100%",
                height: "100%"
              }}
            >
              <ImageContainer
                isUploadedThisPageLoad={isUploadedThisPageLoad}
                isDoneUploading={isDoneUploading}
                isImageLoaded={isImageLoaded}
              >
                <Image
                  src={imageUrl}
                  alt={item.metadata.itemId}
                  onLoad={() => setIsImageLoaded(true)}
                />
                {!isUploadedThisPageLoad && (
                  <Thumbnail
                    src={thumbnailUrl}
                    alt={item.metadata.itemId}
                    onLoad={() => setIsThumbnailLoaded(true)}
                    isThumbnailLoaded={isThumbnailLoaded}
                  />
                )}
              </ImageContainer>
            </TransformComponent>
          </TransformWrapper>
          {isUploadedThisPageLoad && !isDoneUploading && (
            <ImageSpinnerContainer>
              <Spinner size="x-large" />
            </ImageSpinnerContainer>
          )}
        </Media>
        <Details>
          <Name>{item.uploader?.name || user.name}</Name>
          <MetadataAndActions>
            {isUploadedThisPageLoad === undefined ||
            (isUploadedThisPageLoad && isDoneUploading) ? (
              <>
                <UnreadIndicator visible={isUnread} />
                <Time isUnread={isUnread} onClick={handleShare}>
                  {formatDateTime(item.metadata.uploadDate)}
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
              <Reaction key={`item-${item.metadata.itemId}-reaction-${index}`}>
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
                key={`item-${item.metadata.itemId}-add-reaction-${index}`}
                className={hasUserReaction(reaction) ? "selected" : ""}
                onClick={() =>
                  addReaction(item.metadata.itemId, setReactions, {
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
          item={item}
          groupId={groupId}
          user={user}
          disabled={isUploadedThisPageLoad && !isDoneUploading}
        />
      </Container>
    );
  }
);
