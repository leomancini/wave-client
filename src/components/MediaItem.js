import { useState } from "react";
import styled from "styled-components";
import { forwardRef } from "react";
import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";
import { Comments } from "./Comments";
import { Spinner } from "./Spinner";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;

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

const Image = styled.img`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.5s, filter 0.5s;
  filter: blur(8px);

  &.loaded {
    filter: blur(0px);
    opacity: 1;
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  filter: blur(8px);
  transform: scale(1.125);
  transform-origin: center;
  opacity: 0;
  transition: opacity 0.5s;

  &.loaded {
    opacity: 1;
  }
`;

const Details = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 1rem;
  padding: 0 1rem;
  min-height: 1.25rem;
`;

const Name = styled.p`
  font-weight: bold;
`;

const Time = styled.p`
  color: rgba(0, 0, 0, 0.5);
`;

const ReactionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 0.5rem;
  gap: 1.5rem;
`;

const AddReactionButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
`;

const AddReactionButton = styled.button`
  flex: 1;
  outline: none;
  border: none;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 2rem;
  font-size: 1.25rem;
  height: 2.625rem;
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

  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.075);
    outline: none;
  }

  &:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(0.9) translateZ(0);
    backface-visibility: hidden;
  }

  &.selected {
    background-color: rgba(0, 0, 0, 0);
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1), 0px 1px 8px rgba(0, 0, 0, 0.15);

    &:hover {
      background-color: rgba(0, 0, 0, 0);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0);
    }
  }

  &:disabled {
    opacity: 0.75;
    background: rgba(0, 0, 0, 0.025);
    cursor: not-allowed;
    color: inherit;
  }
`;

const Reactions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  height: 1.25rem;
  padding: 0 0.5rem;

  ${({ $isEmpty }) =>
    $isEmpty &&
    `
      display: none;
    `}
`;

const Reaction = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
`;

const ReactionEmoji = styled.div`
  font-size: 1.25rem;
`;

let lastClickTime = 0;
let lastTouchTime = 0;

export const handleMediaItemClick = (
  e,
  filename,
  setReactions,
  { groupId, user, reaction }
) => {
  const currentTime = new Date().getTime();
  const isTouch = e.type === "touchend";

  if (isTouch) {
    e.preventDefault();
    if (lastTouchTime && currentTime - lastTouchTime < 300) {
      addReaction(filename, setReactions, { groupId, user, reaction });
      lastTouchTime = 0;
    } else {
      lastTouchTime = currentTime;
    }
  } else {
    if (lastClickTime && currentTime - lastClickTime < 300) {
      addReaction(filename, setReactions, { groupId, user, reaction });
      lastClickTime = 0;
    } else {
      lastClickTime = currentTime;
    }
  }
};

const addReaction = async (
  filename,
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
    const img = document.querySelector(`img[alt="${filename}"]`);
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
      `${process.env.REACT_APP_API_URL}/media/${groupId}/${filename}/reactions`,
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
  ({ item, imageUrl, thumbnailUrl, groupId, user }, ref) => {
    const { config } = useConfig();

    const [reactions, setReactions] = useState(item.reactions);

    const hasUserReaction = (reactionEmoji) => {
      return reactions.some(
        (r) => r.user.id === user.id && r.reaction === reactionEmoji
      );
    };

    const isPendingAny = reactions.some(
      (r) => r.user.id === user.id && r.isPending
    );

    return (
      <Container ref={ref}>
        <Media
          style={{
            aspectRatio: `${item.metadata.dimensions.width} / ${item.metadata.dimensions.height}`
          }}
          onClick={(e) =>
            handleMediaItemClick(e, item.filename, setReactions, {
              groupId,
              user,
              reaction: "❤️"
            })
          }
          onTouchEnd={(e) =>
            handleMediaItemClick(e, item.filename, setReactions, {
              groupId,
              user,
              reaction: "❤️"
            })
          }
        >
          <Image
            src={imageUrl}
            alt={item.filename}
            onLoad={(e) => e.target.classList.add("loaded")}
          />
          <Thumbnail
            src={thumbnailUrl}
            alt={item.filename}
            onLoad={(e) => e.target.classList.add("loaded")}
          />
        </Media>
        <Details>
          <Name>{item.uploader.name}</Name>
          <Time>{formatDateTime(item.metadata.uploadDate)}</Time>
        </Details>
        <ReactionsContainer>
          <Reactions $isEmpty={Object.keys(reactions).length === 0}>
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
            ).map(([reaction, { users, isPending }]) => (
              <Reaction key={reaction}>
                <ReactionEmoji>{reaction}</ReactionEmoji>
                {users.join(", ")}
                {isPending && <Spinner $size="small" />}
              </Reaction>
            ))}
          </Reactions>
          <AddReactionButtons>
            {config.reactions?.map((reaction) => (
              <AddReactionButton
                key={reaction}
                className={hasUserReaction(reaction) ? "selected" : ""}
                onClick={() =>
                  addReaction(item.filename, setReactions, {
                    groupId,
                    user,
                    reaction
                  })
                }
                disabled={isPendingAny}
              >
                {reaction}
              </AddReactionButton>
            ))}
          </AddReactionButtons>
        </ReactionsContainer>
        <Comments item={item} groupId={groupId} user={user} />
      </Container>
    );
  }
);
