/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";

import { Banner } from "./components/Banner";
import { UploadButton } from "./components/UploadButton";
import { MediaItem } from "./components/MediaItem";

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

  const fetchMediaItems = async (
    groupId,
    pageNum = 1,
    options = { append: false, refresh: false }
  ) => {
    if (!groupId) return;
    setIsLoading(true);

    try {
      if (options.refresh) {
        let allMedia = [];
        let currentPage = 1;
        let hasMoreItems = true;

        while (hasMoreItems && currentPage <= page) {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/media/${groupId}?page=${currentPage}`
          );
          const data = await response.json();
          const mediaArray = Array.isArray(data.media) ? data.media : data;
          allMedia = [...allMedia, ...mediaArray];
          hasMoreItems = data.hasMore;
          currentPage++;
        }

        setMediaItems(allMedia);
        setHasMore(hasMoreItems);
        if (currentPage <= page) {
          setPage(currentPage - 1);
        }
      } else {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/media/${groupId}?page=${pageNum}`
        );
        if (response.ok) {
          const data = await response.json();
          const mediaArray = Array.isArray(data.media) ? data.media : data;
          setHasMore(data.hasMore);
          setMediaItems((prev) =>
            options.append ? [...prev, ...mediaArray] : mediaArray
          );
        }
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
      fetchMediaItems(groupId, 1, { refresh: true });
      setIsUploading(false);
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
            fetchMediaItems(groupId, nextPage, { append: true });
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
            <Banner
              label="NEW"
              date="Dec 23, 2024"
              messages={["You can now comment on any item!"]}
            />
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
                    item={item}
                    imageUrl={imageUrl}
                    thumbnailUrl={thumbnailUrl}
                    fetchMediaItems={fetchMediaItems}
                    groupId={groupId}
                    userId={userId}
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
