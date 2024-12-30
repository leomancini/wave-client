/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { faPlus, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { MediaItem } from "../components/MediaItem";
import { Spinner } from "../components/Spinner";
import { useConfig } from "../contexts/ConfigContext";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const MoreMenu = styled.div`
  position: absolute;
  top: 0;
  margin: 1rem;
  padding: 1rem;
  width: calc(100% - 2rem);
  max-width: 32rem;
  height: calc(100% + 2rem);
  background-color: white;
  z-index: 1000;
  transform: translateX(calc(-100% - 5rem)) rotateZ(-10deg);
  opacity: 0;

  ${(props) =>
    props.$visible &&
    `
    transform: translateX(0) rotateZ(0deg);
    opacity: 1;
  `}

  transition: opacity 0.25s linear, transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
  box-sizing: border-box;
  will-change: transform;
  transform-style: preserve-3d;
  backface-visibility: hidden;

  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);

  border-bottom-left-radius: 0;
  border-top-left-radius: 2rem;
  border-bottom-right-radius: 0;
  border-top-right-radius: 2rem;
`;

const MoreMenuCloseButton = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  width: 100%;
  transition: transform 0.5s ease-in-out;
  transform-origin: top center;
  will-change: transform;
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);

  ${(props) =>
    props.$moreMenuVisible &&
    `
    transform: scale3d(0.9, 0.9, 1);
    `}
`;

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

export const ViewGroup = ({ groupId, userId }) => {
  const { setConfig } = useConfig();
  const [, setSelectedFile] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const observer = useRef();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/config/${groupId}`
        );
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };

    if (groupId) {
      fetchConfig();
    }
  }, [groupId, setConfig]);

  useEffect(() => {
    if (groupId && userId) {
      const init = async () => {
        const userData = await validateUser(groupId, userId);
        if (!userData.valid) {
          setIsLoading(false);
          return;
        } else {
          setUser(userData);
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
        return { valid: false };
      } else {
        return { valid: true, id: userId, name: validateData.userName };
      }
    } catch (error) {
      console.error("Error validating user:", error);
      alert("Error validating user");
      return { valid: false };
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

  useEffect(() => {
    if (isMoreMenuVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMoreMenuVisible]);

  return (
    <Page>
      <MoreMenu $visible={isMoreMenuVisible}>
        <MoreMenuCloseButton>
          <Button
            $type="icon-small"
            $size="large"
            $stretch="fit"
            $prominence="tertiary"
            $icon={faXmark}
            onClick={() => setIsMoreMenuVisible(false)}
          />
        </MoreMenuCloseButton>
      </MoreMenu>
      <PageContainer $moreMenuVisible={isMoreMenuVisible}>
        <ButtonContainer>
          <Button
            $type="icon-small"
            $size="large"
            $stretch="fit"
            $prominence="secondary"
            $icon={faBars}
            onClick={() => setIsMoreMenuVisible(true)}
          />
          <Button
            $isLoading={isUploading}
            $type="icon"
            $size="large"
            $stretch="fill"
            $prominence="primary"
            $icon={faPlus}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              multiple
              disabled={isUploading}
            />
          </Button>
        </ButtonContainer>
        <MediaGrid>
          {mediaItems.map((item, index) => {
            const imageUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}`;
            const thumbnailUrl = `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}/thumbnail`;

            return (
              <MediaItem
                ref={
                  index === mediaItems.length - 1 ? lastMediaElementRef : null
                }
                key={item.filename}
                item={item}
                imageUrl={imageUrl}
                thumbnailUrl={thumbnailUrl}
                fetchMediaItems={fetchMediaItems}
                groupId={groupId}
                user={user}
              />
            );
          })}
          {isLoading && <Spinner $size="x-large" />}
        </MediaGrid>
      </PageContainer>
    </Page>
  );
};
