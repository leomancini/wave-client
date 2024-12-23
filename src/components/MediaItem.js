import styled from "styled-components";

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

const formatDateTime = (date) => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const formattedTime = new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return `${formattedDate} at ${formattedTime}`;
};

export const MediaItem = ({ item, imageUrl, thumbnailUrl }) => {
  return (
    <MediaItemContainer>
      <MediaContainer
        style={{
          aspectRatio: `${item.metadata.dimensions.width} / ${item.metadata.dimensions.height}`
        }}
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
            acc[reaction.reaction].push(reaction.user.name);
            return acc;
          }, {})
        ).map(([reaction, users]) => (
          <div key={reaction}>
            {reaction} {users.join(", ")}
          </div>
        ))}
      </Reactions>
    </MediaItemContainer>
  );
};
