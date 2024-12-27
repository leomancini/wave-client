/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { MediaItem } from "../components/MediaItem";
import { Spinner } from "../components/Spinner";

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

export const ViewGroup = ({ groupId, userId }) => {
  const [, setSelectedFile] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const observer = useRef();

  useEffect(() => {
    if (groupId && userId) {
      const init = async () => {
        const isValidUserId = await validateUser(groupId, userId);
        if (!isValidUserId) {
          setIsLoading(false);
          return;
        }

        setPage(1);
        fetchMediaItems(groupId, 1, false);
      };

      init();
    }
  }, [groupId, userId]);

  const validateUser = async (groupId, userId) => {
    try {
      const validateResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/validate-group-user/${groupId}/${userId}`
      );

      const validateData = await validateResponse.json();
      if (!validateResponse.ok || !validateData.valid) {
        alert("Invalid group or user ID");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error validating user:", error);
      alert("Error validating user");
      return false;
    }
  };

  const fetchMediaItems = async (
    groupId,
    pageNum = 1,
    options = { append: false, refresh: false }
  ) => {
    if (!groupId) return;

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
    <Page>
      <Button $isLoading={isUploading} $type="icon" $size="large" $label="+">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          multiple
          disabled={isUploading}
        />
      </Button>
      <MediaGrid>
        {mediaItems.map((item, index) => {
          const imageUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}`;
          const thumbnailUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}/thumbnail`;

          return (
            <MediaItem
              ref={index === mediaItems.length - 1 ? lastMediaElementRef : null}
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
        {isLoading && <Spinner $size="x-large" />}
      </MediaGrid>
    </Page>
  );
};
