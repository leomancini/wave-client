import React, { useEffect, useState, useCallback, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";
import { MediaItem } from "./components/MediaItem";
import { UploadButton } from "./components/UploadButton";

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

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
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
            <MediaGrid>
              {mediaItems.map((item, index) => {
                const imageUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}`;
                const thumbnailUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}/thumbnail`;

                return (
                  <MediaItem
                    ref={
                      index === mediaItems.length - 1
                        ? lastMediaElementRef
                        : null
                    }
                    key={item.filename}
                    onClick={() =>
                      handleMediaItemClick(item.filename, {
                        userId,
                        reaction: "❤️"
                      })
                    }
                    item={item}
                    imageUrl={imageUrl}
                    thumbnailUrl={thumbnailUrl}
                  />
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
