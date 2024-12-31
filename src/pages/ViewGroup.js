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
  will-change: transform, scale;
  backface-visibility: hidden;
  top: 0;
  gap: 2rem;
  perspective: 1000px;
  -webkit-font-smoothing: antialiased;
  transition: transform 0.5s linear;
  transform: scale(1);
  transform-origin: top center;

  ${(props) =>
    props.$moreMenuVisible &&
    `
    transform: scale(0.5);
    `}
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
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({});
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [statsIsLoading, setStatsIsLoading] = useState(true);
  const observer = useRef();
  const [, startTransition] = useTransition();

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
    const MENU_ANIMATION_DURATION = 750; // 150ms delay + 600ms animation
    const ADDITIONAL_BUFFER = 200; // Extra 200ms to ensure animation is complete

    const fetchStats = async () => {
      // try {
      //   const response = await fetch(
      //     `${process.env.REACT_APP_API_URL}/stats/${groupId}`
      //   );
      //   const data = await response.json();
      //   setStats(data);
      //   setStatsIsLoading(false);
      // } catch (error) {
      //   console.error("Error fetching stats:", error);
      // }
    };

    if (groupId && !isMoreMenuVisible) {
      setStatsIsLoading(true);
      // fetchStats();
    }

    if (isMoreMenuVisible && groupId) {
      const timer = setTimeout(() => {
        setStatsIsLoading(true);
        // fetchStats();
      }, MENU_ANIMATION_DURATION + ADDITIONAL_BUFFER);

      return () => clearTimeout(timer);
    }
  }, [groupId, isMoreMenuVisible]);

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
    options = { append: false }
  ) => {
    if (!groupId) return;

    try {
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
    } catch (error) {
      console.error("Error fetching media items:", error);
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
            setIsLoading(true);
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

    if (groupId) {
      fetchUsers();
    }
  }, [groupId]);

  const handleMenuToggle = () => {
    startTransition(() => {
      setIsMoreMenuVisible((prev) => !prev);
    });
  };

  return (
    <Page>
      <MoreMenu
        $visible={isMoreMenuVisible}
        groupId={groupId}
        users={users}
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
