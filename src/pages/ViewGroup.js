/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useTransition
} from "react";
import styled from "styled-components";
import { faPlus, faBars } from "@fortawesome/free-solid-svg-icons";
import { useConfig } from "../contexts/ConfigContext";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { MediaItem } from "../components/MediaItem";
import { Spinner } from "../components/Spinner";
import { MoreMenu } from "../components/MoreMenu";
import { Banner } from "../components/Banner";
import { EmptyCard } from "../components/EmptyCard";

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
`;

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [statsIsLoading, setStatsIsLoading] = useState(true);
  const observer = useRef();
  const [, startTransition] = useTransition();
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
          fetchMediaItems(groupId, userId, 1, false);
        }
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
        return { valid: false };
      } else {
        if (validateData.isDuplicate && validateData.primaryId) {
          window.location.href = `/${groupId}/${validateData.primaryId}`;
        } else {
          localStorage.setItem("userId", userId);

          const myGroups = JSON.parse(localStorage.getItem("myGroups") || "[]");
          if (!myGroups.includes(groupId)) {
            myGroups.push(groupId);
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
        mediaArray.forEach((item) => {
          if (readItems.has(item.filename)) {
            item.isUnread = false;
          }
        });
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
      fetchMediaItems(groupId, userId, 1, { refresh: true });
      setIsUploading(false);
    }
  };

  const lastMediaElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const filename = entry.target.getAttribute("data-filename");
              markAsRead(filename);
            }
          });

          if (entries[0].isIntersecting && hasMore) {
            setIsLoading(true);
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMediaItems(groupId, userId, nextPage, { append: true });
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
    [isLoading, hasMore, groupId, userId, page]
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
    startTransition(() => {
      setIsMoreMenuVisible((prev) => !prev);
    });
  };

  const markAsRead = (filename) => {
    setMediaItems((prevItems) => {
      const item = prevItems.find((item) => item.filename === filename);
      if (!item?.isUnread) return prevItems;

      setPendingReadItems((prev) => new Set(prev).add(filename));

      setTimeout(() => {
        setMediaItems((currentItems) =>
          currentItems.map((item) =>
            item.filename === filename ? { ...item, isUnread: false } : item
          )
        );
      }, 1000);

      return prevItems;
    });
  };

  const sendReadItemsToServer = async (items) => {
    const itemsToMark = Array.from(items).filter(
      (filename) => !readItems.has(filename) && !processingItems.has(filename)
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
        <Spinner $size="x-large" />
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
        setIsMoreMenuVisible={setIsMoreMenuVisible}
      />
      <PageContainer $moreMenuVisible={isMoreMenuVisible}>
        <ButtonContainer>
          <Button
            $type="icon-small"
            $size="large"
            $stretch="fit"
            $prominence="secondary"
            $icon={faBars}
            onClick={handleMenuToggle}
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
        <Banner
          label="NEW"
          date="Jan 6, 2025"
          messagesAlignment="center"
          messages={["Unread posts are marked with a blue dot!"]}
        />
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
                isUnread={item.isUnread}
                data-filename={item.filename}
                onLoad={() => markAsRead(item.filename)}
              />
            );
          })}
          {isLoading && hasMore && <Spinner $size="x-large" />}
        </MediaGrid>
      </PageContainer>
    </Page>
  );
};
