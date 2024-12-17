import React, { useEffect, useState, useCallback, useRef } from "react";
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
  padding: 1rem 2rem 1.25rem 2rem;
  width: calc(100% - 4rem);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0px 0px 24px rgba(0, 122, 255, 0.5),
    0px 2px 4px rgba(0, 122, 255, 0.25);
  gap: 0.75rem;

  p,
  strong {
    margin: 0;
    line-height: 1.25rem;
    font-size: 1rem;
    text-align: center;
  }

  p {
    font-weight: medium;
  }

  strong {
    font-weight: bold;
  }
`;

const Tag = styled.div`
  background: rgba(0, 122, 255, 1);
  padding: 0.75rem 1rem;
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: medium;
  margin-bottom: 0.5rem;

  strong {
    color: rgba(255, 255, 255, 1);
    font-weight: bold;
    margin: 0;
    padding: 0;
    font-size: 1rem;
    line-height: 0.75rem;
    margin-right: 0.25rem;
  }
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
`;

const MediaThumbnail = styled.img`
  width: 100%;
  filter: blur(24px);
  opacity: 0.5;
  transform: scale(1.25);
  transform-origin: center;
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef();

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const pathParts = path.substring(1).split("/");
    const [groupId, userId] = pathParts;

    if (!groupId) {
      alert("No group ID");
      return;
    }

    if (!userId) {
      alert("No user ID");
      return;
    }

    setGroupId(groupId);
    setUserId(userId);
    fetchMediaItems(groupId);
  }, []);

  useEffect(() => {
    if (groupId) {
      setPage(1);
      fetchMediaItems(groupId, 1, false);
    }
  }, [groupId]);

  const fetchMediaItems = async (groupId, pageNum = 1, append = false) => {
    if (!groupId) return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/${groupId}?page=${pageNum}`
      );
      if (response.ok) {
        const data = await response.json();
        const mediaArray = Array.isArray(data.media) ? data.media : data;
        setHasMore(mediaArray.length > 0);
        setMediaItems((prev) =>
          append ? [...prev, ...mediaArray] : mediaArray
        );
      }
    } catch (error) {
      console.error("Error fetching media items:", error);
      setMediaItems([]);
    } finally {
      setIsLoading(false);
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
      await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: "POST",
        body: formData
      });
    } catch (error) {
      alert("Sorry, something went wrong.");
    } finally {
      fetchMediaItems(groupId);
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

  const lastMediaElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMediaItems(groupId, nextPage, true);
          }
        },
        {
          root: null,
          rootMargin: "20px",
          threshold: 0.1
        }
      );

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, groupId, page]
  );

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
            {/* <Banner>
              <Tag>
                <strong>Bug Fixes</strong> Dec 5, 2024
              </Tag>
              <p>When uploading, it won't temporarily show duplicate images</p>
              <p>
                Images are now compressed, which should speed up loading times
              </p>
              <strong>Enjoy!</strong>
            </Banner> */}
            <MediaGrid>
              {mediaItems.map((item, index) => {
                const imageUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}`;
                const thumbnailUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}/thumbnail`;
                if (index === mediaItems.length - 1) {
                  return (
                    <MediaItem
                      ref={lastMediaElementRef}
                      key={item.filename}
                      onClick={() =>
                        handleMediaItemClick(item.filename, {
                          userId,
                          reaction: "❤️"
                        })
                      }
                    >
                      <MediaContainer
                        style={{
                          aspectRatio: `${item.metadata.width} / ${item.metadata.height}`
                        }}
                      >
                        <MediaImage src={imageUrl} alt={item.filename} />
                        <MediaThumbnail
                          src={thumbnailUrl}
                          alt={item.filename}
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
                    </MediaItem>
                  );
                }

                return (
                  <MediaItem
                    key={item.filename}
                    onClick={() =>
                      handleMediaItemClick(item.filename, {
                        userId,
                        reaction: "❤️"
                      })
                    }
                  >
                    <MediaContainer
                      style={{
                        aspectRatio: `${item.metadata.width} / ${item.metadata.height}`
                      }}
                    >
                      <MediaImage src={imageUrl} alt={item.filename} /> */}
                      <MediaThumbnail src={thumbnailUrl} alt={item.filename} />
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
                  </MediaItem>
                );
              })}
              {isLoading && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "20px"
                  }}
                >
                  Loading...
                </div>
              )}
            </MediaGrid>
          </Container>
        )}
      </Page>
    </BrowserRouter>
  );
}

export default App;
