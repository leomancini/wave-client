import styled from "styled-components";
import { forwardRef } from "react";

import { formatDateTime } from "../utilities/formatDateTime";
import { Comments } from "./Comments";

const MediaItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;

  p {
    margin: 0;
  }
`;

const MediaContainer = styled.div`
  position: relative;
  border-radius: 2rem;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0;
  background-color: rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const MediaImage = styled.img`
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

const MediaThumbnail = styled.img`
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

const MediaDetails = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 1rem;
  padding: 0 1rem;
`;

const Name = styled.p`
  font-weight: bold;
`;

const Time = styled.p`
  color: rgba(0, 0, 0, 0.5);
`;

const Reactions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 1rem;
`;

const Reaction = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
`;

const ReactionEmoji = styled.div`
  font-size: 1.125rem;
`;

export const handleMediaItemClick = async (
  filename,
  fetchMediaItems,
  { groupId, userId, reaction }
) => {
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

  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/media/${groupId}/${filename}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          reaction
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add reaction");
    }

    fetchMediaItems(groupId);
  } catch (error) {
    console.error("Error adding reaction:", error);
  }
};

export const MediaItem = forwardRef(
  ({ item, imageUrl, thumbnailUrl, fetchMediaItems, groupId, userId }, ref) => {
    return (
      <MediaItemContainer ref={ref}>
        <MediaContainer
          style={{
            aspectRatio: `${item.metadata.dimensions.width} / ${item.metadata.dimensions.height}`
          }}
          onClick={() =>
            handleMediaItemClick(item.filename, fetchMediaItems, {
              groupId,
              userId,
              reaction: "❤️"
            })
          }
        >
          <MediaImage
            src={imageUrl}
            alt={item.filename}
            onLoad={(e) => e.target.classList.add("loaded")}
          />
          <MediaThumbnail
            src={thumbnailUrl}
            alt={item.filename}
            onLoad={(e) => e.target.classList.add("loaded")}
          />
        </MediaContainer>
        <MediaDetails>
          <Name>{item.uploader.name}</Name>
          <Time>{formatDateTime(item.metadata.uploadDate)}</Time>
        </MediaDetails>
        <Reactions>
          {Object.entries(
            item.reactions.reduce((acc, reaction) => {
              if (!acc[reaction.reaction]) {
                acc[reaction.reaction] = [];
              }
              acc[reaction.reaction].push(
                reaction.user.id === userId ? "You" : reaction.user.name
              );
              return acc;
            }, {})
          ).map(([reaction, users]) => (
            <Reaction key={reaction}>
              <ReactionEmoji>{reaction}</ReactionEmoji> {users.join(", ")}
            </Reaction>
          ))}
        </Reactions>
        <Comments item={item} groupId={groupId} userId={userId} />
      </MediaItemContainer>
    );
  }
);
