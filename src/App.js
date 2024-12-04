import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";

const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  width: calc(100vw - 2rem);
  max-width: 32rem;
`;

const Banner = styled.div`
  margin-bottom: 2.5rem;
  line-height: 0.5rem;
  color: rgba(0, 0, 0, 1);
  border: none;
  border-radius: 2rem;
  min-height: 4rem;
  padding: 1rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0px 0px 24px rgba(0, 122, 255, 0.5),
    0px 2px 4px rgba(0, 122, 255, 0.25);
  gap: 0.75rem;

  p {
    margin: 0;
    line-height: 2rem;
    font-size: 1.125rem;
    font-weight: bold;
  }
`;

const Tag = styled.div`
  background: rgba(0, 122, 255, 1);
  padding: 0.75rem 1rem;
  border-radius: 2rem;
  color: rgba(255, 255, 255, 1);
  font-size: 1rem;
  font-weight: bold;
`;

const UploadButton = styled.label`
  margin-bottom: 2.5rem;
  cursor: ${(props) => (props.$isLoading ? "default" : "pointer")};
  background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? 0.5 : 1)});
  height: 4rem;
  line-height: 0.5rem;
  color: rgba(255, 255, 255, 1);
  border: none;
  border-radius: 2rem;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  span {
    height: 100%;
    line-height: 140%;
    font-size: 2.5rem;

    &.loading {
      height: unset;
      line-height: unset;
      font-size: 1.25rem;
    }
  }

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-touch-callout: none;

  transition: transform 0.2s, opacity 0.2s;

  &:active {
    transform: ${(props) => (props.$isLoading ? "none" : "scale(0.95)")};
    opacity: ${(props) => (props.$isLoading ? 0.5 : 0.75)};
  }

  input[type="file"] {
    display: none;
  }
`;

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const MediaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;

  img {
    border-radius: 2rem;
    width: 100%;
    box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    margin: 0;
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

function App() {
  const [, setSelectedFile] = useState(null);
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const pathParts = path.substring(1).split("/");
    const [groupId, userId] = pathParts;

    if (groupId) {
      setGroupId(groupId);
      setUserId(userId);
      fetchMediaItems(groupId);
    } else {
      alert("No group selected!");
      return;
    }
  }, []);

  const fetchMediaItems = async (groupId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/${groupId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data.media);
      }
    } catch (error) {
      console.error("Error fetching media items:", error);
    }
  };

  const handleFileUpload = async (event) => {
    if (isUploading) return;

    setIsUploading(true);
    const files = event.target.files;

    if (files.length === 0) return;

    if (files.length === 1) {
      setSelectedFile(files[0]);
    }

    const formData = new FormData();
    const filesArray = Array.from(files);

    filesArray.forEach((file) => {
      const renamedFile = new File(
        [file],
        `${groupId}-${userId}-${file.name}`,
        {
          type: file.type
        }
      );
      formData.append("media", renamedFile);
    });

    formData.append("group", groupId);
    formData.append("uploaderId", userId);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log(data);

      fetchMediaItems(groupId);
    } catch (error) {
      alert("Sorry, something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleMediaItemClick = async (filename, { userId, reaction }) => {
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

  return (
    <BrowserRouter basename="/">
      <Page>
        {groupId && (
          <Container>
            <UploadButton $isLoading={isUploading}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                multiple
                disabled={isUploading}
              />
              <span className={isUploading ? "loading" : ""}>
                {isUploading ? "Uploading..." : "+"}
              </span>
            </UploadButton>
            <Banner>
              <Tag>New</Tag>
              <p>Tap any image to react</p>
            </Banner>
            <MediaGrid>
              {mediaItems.map((item, index) => (
                <MediaItem
                  key={index}
                  onClick={() => {
                    handleMediaItemClick(item.filename, {
                      userId,
                      reaction: "❤️"
                    });
                  }}
                >
                  <img
                    src={`${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}`}
                    alt={item.filename}
                  />
                  <MediaDetails>
                    <Name>{item.uploader.name}</Name>
                    <Time>{formatDateTime(item.created)}</Time>
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
                </MediaItem>
              ))}
            </MediaGrid>
          </Container>
        )}
      </Page>
    </BrowserRouter>
  );
}

export default App;
