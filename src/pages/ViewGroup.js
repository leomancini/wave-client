/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { faPlus, faBars } from "@fortawesome/free-solid-svg-icons";
import { useConfig } from "../contexts/ConfigContext";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { MediaItem } from "../components/MediaItem";
import { Spinner } from "../components/Spinner";
import { MoreMenu } from "../components/MoreMenu";
import { EmptyCard } from "../components/EmptyCard";
import { Banner } from "../components/Banner";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  top: 0;
  gap: 2rem;
  pointer-events: ${(props) => (props.$moreMenuVisible ? "none" : "auto")};
  position: ${(props) => (props.$moreMenuVisible ? "fixed" : "initial")};
  z-index: 1;
`;

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const PageContainerInteractionBlocker = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  pointer-events: ${(props) => (props.$visible ? "all" : "none")};
  z-index: 2;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
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
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(
    window.location.hash === "#menu"
  );
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [statsIsLoading, setStatsIsLoading] = useState(true);
  const observer = useRef();
  const [readItems, setReadItems] = useState(new Set());
  const [processingItems, setProcessingItems] = useState(new Set());
  const [, setPendingReadItems] = useState(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

    if (user.valid && groupId) {
      fetchConfig();
    }
  }, [user, groupId, setConfig]);

  useEffect(() => {
    const MENU_ANIMATION_DURATION = 400;
    const ADDITIONAL_BUFFER = 200;

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/stats/${groupId}`
        );
        const data = await response.json();
        setStats(data);
        setStatsIsLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (user.valid && groupId && !isMoreMenuVisible) {
      setStatsIsLoading(true);
      fetchStats();
    }

    if (isMoreMenuVisible && groupId) {
      const timer = setTimeout(() => {
        setStatsIsLoading(true);
        fetchStats();
      }, MENU_ANIMATION_DURATION + ADDITIONAL_BUFFER);

      return () => clearTimeout(timer);
    }
  }, [user, groupId, isMoreMenuVisible]);

  useEffect(() => {
    if (groupId && userId) {
      const init = async () => {
        const userData = await validateUser(groupId, userId);
        if (!userData.valid) {
          setIsLoading(false);
          setIsInitialLoad(false);
          return;
        } else {
          setUser(userData);
          setPage(1);

          const promises = [
            fetch(`${process.env.REACT_APP_API_URL}/config/${groupId}`)
              .then((response) => response.json())
              .then((data) => setConfig(data))
              .catch((error) => console.error("Error fetching config:", error)),
            fetchMediaItems(groupId, userId, 1, false)
          ];

          await Promise.all(promises);
        }
      };

      init();
    }
  }, [groupId, userId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      document.title = `${groupId} – ${user.name}`;
    }
  }, [groupId, user]);

  const validateUser = async (groupId, userId) => {
    try {
      const validateResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/validate-group-user/${groupId}/${userId}`
      );

      const validateData = await validateResponse.json();
      if (!validateResponse.ok || !validateData.valid) {
        return { valid: false };
      } else {
        if (validateData.isDuplicate && validateData.primaryId) {
          window.location.href = `/${groupId}/${validateData.primaryId}`;
        } else {
          // Remove any existing userId from localStorage (from previous implementation)
          localStorage.removeItem("userId");

          const myGroups = JSON.parse(localStorage.getItem("myGroups") || "[]");
          if (!myGroups.some((group) => group.groupId === groupId)) {
            myGroups.push({ groupId, userId });
            localStorage.setItem("myGroups", JSON.stringify(myGroups));
          }
        }

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
    userId,
    pageNum = 1,
    options = { append: false }
  ) => {
    if (!groupId) return;

    // TODO: Exclude optimistically uploaded items from the fetch,
    // since we already have them on the client
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/${groupId}?userId=${userId}&page=${pageNum}`
      );
      if (response.ok) {
        const data = await response.json();
        const mediaArray = Array.isArray(data.media) ? data.media : data;

        setHasMore(data.hasMore);
        setMediaItems((prev) =>
          options.append ? [...prev, ...mediaArray] : mediaArray
        );
      }
    } catch (error) {
      console.error("Error fetching media items:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
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

    // Create temporary media items with correct dimensions
    const optimisticallyUploadedMediaItems = await Promise.all(
      Array.from(files).map(async (file) => {
        const dimensions = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height
            });
            URL.revokeObjectURL(img.src);
          };
          img.src = URL.createObjectURL(file);
        });

        const itemId = `${Date.now()}-${userId}-${Math.floor(
          Math.random() * 10000000000
        )}`;

        return {
          file,
          metadata: {
            itemId,
            uploadDate: new Date().toISOString(),
            uploaderId: userId,
            dimensions
          },
          uploader: {
            name: user.name
          },
          isUploadedThisPageLoad: true,
          isDoneUploading: false,
          skipThumbnail: true,
          localUrl: URL.createObjectURL(file),
          comments: [],
          reactions: []
        };
      })
    );

    setMediaItems((prev) => [...optimisticallyUploadedMediaItems, ...prev]);

    const formData = new FormData();

    optimisticallyUploadedMediaItems.forEach((tempMediaItem) => {
      const file = tempMediaItem.file;
      const media = new File([file], `${groupId}-${userId}-${file.name}`, {
        type: file.type
      });
      formData.append("media", media);
      formData.append("itemId", tempMediaItem.metadata.itemId);
    });

    formData.append("group", groupId);
    formData.append("uploaderId", userId);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      optimisticallyUploadedMediaItems.forEach((item) => {
        URL.revokeObjectURL(item.localUrl);
      });

      setMediaItems((currentMediaItems) => {
        return currentMediaItems.map((item) => {
          if (item.isUploadedThisPageLoad) {
            item.isDoneUploading = true;
          }
          return item;
        });
      });
    } catch (error) {
      console.error("Upload error:", error);
      setMediaItems((prev) =>
        prev.filter((item) => !item.isUploadedThisPageLoad)
      );
      optimisticallyUploadedMediaItems.forEach((item) => {
        URL.revokeObjectURL(item.localUrl);
      });
      alert("Sorry, something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const lastMediaElementRef = useCallback(
    (node) => {
      if (isLoading) return;

      if (observer.current?.scroll) {
        observer.current.scroll.disconnect();
      }

      const scrollObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setIsLoading(true);
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMediaItems(groupId, userId, nextPage, { append: true });
          }
        },
        {
          root: null,
          rootMargin: "0px",
          threshold: 0.5
        }
      );

      if (node) {
        scrollObserver.observe(node);
        observer.current = {
          scroll: scrollObserver
        };
      }
    },
    [isLoading, hasMore, groupId, userId, page]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.scroll?.disconnect();
      }
    };
  }, []);

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/users/${groupId}`
        );
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (user.valid && groupId) {
      fetchUsers();
    }
  }, [user, groupId]);

  const handleMenuToggle = () => {
    if (process.env.NODE_ENV === "development") {
      if (isMoreMenuVisible) {
        window.history.replaceState(null, null, " ");
      } else {
        window.location.hash = "menu";
      }
    }

    setIsMoreMenuVisible(!isMoreMenuVisible);
  };

  const markAsRead = (itemId) => {
    setMediaItems((currentMediaItems) => {
      const item = currentMediaItems.find(
        (item) => item.metadata.itemId === itemId
      );
      if (!item?.isUnread) return currentMediaItems;

      setPendingReadItems((prev) => new Set(prev).add(itemId));

      setTimeout(() => {
        setMediaItems((currentMediaItems) =>
          currentMediaItems.map((item) =>
            item.metadata.itemId === itemId
              ? { ...item, isUnread: false }
              : item
          )
        );
      }, 1000);

      return currentMediaItems;
    });
  };

  const sendReadItemsToServer = async (items) => {
    const itemsToMark = Array.from(items).filter(
      (itemId) => !readItems.has(itemId) && !processingItems.has(itemId)
    );
    if (itemsToMark.length === 0) return;

    try {
      setProcessingItems((prev) => new Set([...prev, ...itemsToMark]));

      await fetch(
        `${process.env.REACT_APP_API_URL}/mark-items-read/${groupId}/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ items: itemsToMark })
        }
      );

      setReadItems((prev) => new Set([...prev, ...itemsToMark]));

      setProcessingItems((prev) => {
        const newSet = new Set(prev);
        itemsToMark.forEach((item) => newSet.delete(item));
        return newSet;
      });
    } catch (error) {
      console.error("Error marking items as read:", error);
      setProcessingItems((prev) => {
        const newSet = new Set(prev);
        itemsToMark.forEach((item) => newSet.delete(item));
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (!user.valid || !groupId || !userId) return;

    const intervalId = setInterval(() => {
      setPendingReadItems((pending) => {
        if (pending.size > 0) {
          sendReadItemsToServer(pending);
          return new Set();
        }
        return pending;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user.valid, groupId, userId]);

  if (isInitialLoad && isLoading) {
    return (
      <Page $fullHeight>
        <Spinner size="x-large" />
      </Page>
    );
  }

  if (!user.valid) {
    return (
      <Page $fullHeight>
        <EmptyCard>
          <p>Sorry, something went wrong.</p>
        </EmptyCard>
      </Page>
    );
  }

  return (
    <Page>
      <MoreMenu
        $visible={isMoreMenuVisible}
        groupId={groupId}
        users={users}
        user={user}
        stats={stats}
        statsIsLoading={statsIsLoading}
        setIsMoreMenuVisible={handleMenuToggle}
        style={{ zIndex: 3 }}
      />
      <PageContainerInteractionBlocker $visible={isMoreMenuVisible} />
      <PageContainer>
        <ButtonContainer>
          <Button
            type="icon-small"
            size="large"
            stretch="fit"
            $prominence="secondary"
            icon={faBars}
            onClick={handleMenuToggle}
          />
          <Button
            disabled={isUploading}
            type="icon"
            size="large"
            stretch="fill"
            prominence="primary"
            icon={faPlus}
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
        <Banner
          label="NEW"
          date="Jan 9, 2025"
          messagesAlignment="left"
          messages={[
            "🎲&nbsp; Anyone can change the reaction emojis.",
            "👀&nbsp; Everyone can use the new emojis.",
            "💞&nbsp; Open the menu to try it out!"
          ]}
        />
        <MediaGrid>
          {mediaItems.map((item, index) => {
            return (
              <MediaItem
                ref={
                  index === mediaItems.length - 1 ? lastMediaElementRef : null
                }
                key={item.metadata.itemId}
                item={item}
                imageUrl={
                  item.isUploadedThisPageLoad
                    ? item.localUrl
                    : `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.metadata.itemId}`
                }
                thumbnailUrl={
                  item.isUploadedThisPageLoad
                    ? null
                    : `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.metadata.itemId}/thumbnail`
                }
                fetchMediaItems={fetchMediaItems}
                groupId={groupId}
                user={user}
                isUnread={item.isUnread}
                onLoad={(itemId) => markAsRead(itemId)}
                isUploadedThisPageLoad={item.isUploadedThisPageLoad}
                isDoneUploading={
                  item.isUploadedThisPageLoad ? item.isDoneUploading : true
                }
              />
            );
          })}
          {isLoading && hasMore && <Spinner size="x-large" />}
        </MediaGrid>
      </PageContainer>
    </Page>
  );
};
