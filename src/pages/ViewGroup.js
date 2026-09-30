/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext
} from "react";
import styled from "styled-components";

import { NotificationContext, AppContext } from "../App";
import { useConfig } from "../contexts/ConfigContext";
import { useMoreMenu } from "../contexts/MoreMenuContext";
import { handleGroupRedirect } from "../utilities/groupRedirects";

import {
  faPlus,
  faBars,
  faMicrophone,
  faPhotoFilm,
  faXmark
} from "@fortawesome/free-solid-svg-icons";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { MediaPost } from "../components/MediaPost";
import { Spinner } from "../components/Spinner";
import { MoreMenu } from "../components/MoreMenu";
import { EmptyCard } from "../components/EmptyCard";
import { Banner } from "../components/Banner";
import { RecordingBar } from "../components/RecordingBar";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

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
  pointer-events: ${(props) => (props.moreMenuVisible ? "none" : "auto")};
  position: ${(props) => (props.moreMenuVisible ? "fixed" : "initial")};
  z-index: 1;
`;

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  align-items: center;
`;

const PageContainerInteractionBlocker = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  pointer-events: ${(props) => (props.visible ? "all" : "none")};
  z-index: 2;
  opacity: ${(props) => (props.visible ? 1 : 0)};
`;

export const ViewGroup = ({ groupId, userId }) => {
  const { setConfig } = useConfig();
  const { setIsMoreMenuOpen } = useMoreMenu();
  const [mediaItems, setMediaItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  // true while the + button is expanded into photo/video + audio + close
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const audioRecorder = useAudioRecorder();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(
    window.location.hash === "#menu"
  );
  const [scrollToItemId, setScrollToItemId] = useState(
    window.location.hash.slice(1)
  );
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [statsIsLoading, setStatsIsLoading] = useState(true);
  const [notificationPreference, setNotificationPreference] = useState(null);
  const observer = useRef();
  const [readItems, setReadItems] = useState(new Set());
  const [processingItems, setProcessingItems] = useState(new Set());
  const [, setPendingReadItems] = useState(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    isSubscribed,
    isSubscriptionLoading,
    isCheckingSubscription,
    setupPushNotifications,
    pushPermission,
    checkSubscriptionStatus,
    localPushNotificationsEnabled,
    isSettingUpPushNotifications
  } = useContext(NotificationContext);
  const { isPWA } = useContext(AppContext);

  useEffect(() => {
    if (
      user.valid &&
      user.notificationPreference === "PUSH" &&
      !isSubscribed &&
      !isSubscriptionLoading
    ) {
      checkSubscriptionStatus();
    }
  }, [
    user.valid,
    user.notificationPreference,
    checkSubscriptionStatus,
    isSubscribed,
    isSubscriptionLoading
  ]);

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
        // Check if this group has been renamed before validating user
        const wasRedirected = await handleGroupRedirect(groupId, `/${userId}`);
        if (wasRedirected) {
          return; // Exit early since we're redirecting
        }

        const userData = await validateUser(groupId, userId);
        if (!userData.valid) {
          setIsLoading(false);
          setIsInitialLoad(false);
          return;
        } else {
          setUser(userData);
          setPage(1);

          try {
            const [configData] = await Promise.all([
              fetch(`${process.env.REACT_APP_API_URL}/config/${groupId}`).then(
                (response) => response.json()
              ),
              fetchMediaItems(groupId, userId, 1, false)
            ]);
            setConfig(configData);
          } catch (error) {
            console.error("Error fetching initial data:", error);
          }
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

  useEffect(() => {
    if (user.valid) {
      setNotificationPreference(user.notificationPreference);
    }
  }, [user.valid, user.notificationPreference]);

  useEffect(() => {
    if (
      user.valid &&
      notificationPreference === "PUSH" &&
      navigator.serviceWorker
    ) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "NOTIFICATION_CLICKED") {
          const itemId = event.data.data?.itemId;
          const commentIndex = event.data.data?.commentIndex;
          if (itemId) {
            setScrollToItemId(
              commentIndex !== undefined
                ? `${itemId}-comment-${commentIndex}`
                : itemId
            );
          }
        }
      });
    }
  }, [user.valid, notificationPreference]);

  // Update global more menu state when local state changes
  useEffect(() => {
    setIsMoreMenuOpen(isMoreMenuVisible);
  }, [isMoreMenuVisible, setIsMoreMenuOpen]);

  // Reset more menu state when component unmounts
  useEffect(() => {
    return () => {
      setIsMoreMenuOpen(false);
    };
  }, [setIsMoreMenuOpen]);

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
          if (
            !myGroups.some(
              (group) => group.groupId === groupId && group.userId === userId
            )
          ) {
            myGroups.push({ groupId, userId });
            localStorage.setItem("myGroups", JSON.stringify(myGroups));
          }
        }

        return validateData;
      }
    } catch (error) {
      console.error("Error validating user:", error);
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

  // Read a clip's length off an <audio> element. iOS may not fire
  // loadedmetadata for a blob without playing it, and Chrome reports
  // Infinity for freshly recorded webm, so fall back to null and let the
  // server-measured duration take over once the post reloads.
  const probeAudioDuration = (file) =>
    new Promise((resolve) => {
      const audio = document.createElement("audio");
      const url = URL.createObjectURL(file);
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(value) && value > 0 ? value : null);
      };
      audio.preload = "metadata";
      audio.onloadedmetadata = () => finish(audio.duration);
      audio.onerror = () => finish(null);
      setTimeout(() => finish(null), 3000);
      audio.src = url;
    });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    // Reset so picking the same file again still fires onChange
    event.target.value = "";
    setIsComposeOpen(false);
    uploadFiles(files.map((file) => ({ file })));
  };

  const handleStartRecording = async () => {
    if (isUploading || audioRecorder.isRecording || audioRecorder.isStarting) return;
    setIsComposeOpen(false);
    try {
      await audioRecorder.start();
    } catch (error) {
      console.error("Could not start recording:", error);
      if (error && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
        alert("Microphone access is blocked. Allow it in your browser settings to record audio.");
      } else if (error && error.name === "NotFoundError") {
        alert("No microphone was found on this device.");
      } else {
        alert("Could not start recording. Please try again.");
      }
    }
  };

  const handleFinishRecording = async () => {
    const result = await audioRecorder.stop();
    if (!result) return;
    const extension = result.blob.type.includes("webm")
      ? "webm"
      : result.blob.type.includes("ogg")
      ? "ogg"
      : "m4a";
    const file = new File([result.blob], `recording.${extension}`, {
      type: result.blob.type
    });
    uploadFiles([{ file, duration: result.duration }]);
  };

  const handleCancelRecording = () => {
    audioRecorder.cancel();
  };

  // entries: [{ file, duration? }] — duration is only known up front for
  // clips we just recorded
  const uploadFiles = async (entries) => {
    if (isUploading) return;

    const uploadQueue = entries.filter((entry) => entry && entry.file).slice(0, 4);

    if (uploadQueue.length === 0) {
      return;
    }

    setIsUploading(true);

    // Pre-generate all item IDs and dimensions
    const itemsWithMeta = await Promise.all(
      uploadQueue.map(async ({ file, duration: knownDuration }, index) => {
        const isVideo = file.type.startsWith("video/");
        const isAudio = file.type.startsWith("audio/");

        const duration = isAudio
          ? knownDuration || (await probeAudioDuration(file))
          : undefined;

        const dimensions = await new Promise((resolve) => {
          if (isAudio) {
            resolve(null);
          } else if (isVideo) {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => {
              resolve({
                width: video.videoWidth,
                height: video.videoHeight
              });
              URL.revokeObjectURL(video.src);
            };
            video.onerror = () => {
              resolve({ width: 16, height: 9 });
              URL.revokeObjectURL(video.src);
            };
            video.src = URL.createObjectURL(file);
          } else {
            const img = new Image();
            img.onload = () => {
              resolve({
                width: img.width,
                height: img.height
              });
              URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
          }
        });

        const itemId = `${Date.now()}-${userId}-${Math.floor(
          Math.random() * 10000000000
        )}`;

        return {
          file,
          itemId,
          dimensions,
          localUrl: URL.createObjectURL(file),
          isVideo,
          isAudio,
          duration,
          orderIndex: index
        };
      })
    );

    // For multi-file uploads, use the first itemId as the postId
    const postId = itemsWithMeta[0].itemId;

    // Create a single optimistic post containing all photos
    const optimisticPost = {
      postId,
      items: itemsWithMeta.map(({ file, itemId, dimensions, localUrl, isVideo, isAudio, duration, orderIndex }) => ({
        metadata: {
          itemId,
          postId,
          uploadDate: new Date().toISOString(),
          uploaderId: userId,
          dimensions,
          orderIndex,
          ...(isVideo ? { mediaType: "video" } : {}),
          ...(isAudio ? { mediaType: "audio", duration: duration || undefined } : {})
        },
        localUrl,
        isUploadedThisPageLoad: true
      })),
      uploader: {
        id: userId,
        name: user.name
      },
      uploadDate: Date.now(),
      isUploadedThisPageLoad: true,
      isDoneUploading: false,
      comments: [],
      reactions: []
    };

    setMediaItems((prev) => [optimisticPost, ...prev]);

    // Upload all files in a single request
    const formData = new FormData();
    itemsWithMeta.forEach(({ file, itemId }) => {
      const media = new File([file], `${groupId}-${itemId}`, {
        type: file.type
      });
      formData.append("media", media);
    });
    formData.append("group", groupId);
    formData.append("uploaderId", userId);
    formData.append("orderIndexes", JSON.stringify(
      itemsWithMeta.reduce((acc, { itemId, orderIndex }) => {
        acc[itemId] = orderIndex;
        return acc;
      }, {})
    ));

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      setMediaItems((currentPosts) =>
        currentPosts.map((p) =>
          p.postId === postId ? { ...p, isDoneUploading: true } : p
        )
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
      setMediaItems((prev) => prev.filter((p) => p.postId !== postId));
    }

    setIsUploading(false);
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

    if (isMoreMenuVisible) {
      validateUser(groupId, userId).then((userData) => {
        if (userData.valid) {
          setUser(userData);
        }
      });
    }

    const newState = !isMoreMenuVisible;
    setIsMoreMenuVisible(newState);
  };

  const handleUserUpdate = (updatedUser) => {
    // Update the current user object while preserving existing properties
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUser
    }));

    // Update the user in the users array
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === updatedUser.id ? { ...u, ...updatedUser } : u
      )
    );
  };

  const markAsRead = (postId) => {
    setMediaItems((currentPosts) => {
      const post = currentPosts.find((p) => p.postId === postId);
      if (!post?.isUnread) return currentPosts;

      // Mark the postId as read (unread entries are stored by postId)
      setPendingReadItems((prev) => new Set(prev).add(postId));

      setTimeout(() => {
        setMediaItems((currentPosts) =>
          currentPosts.map((p) =>
            p.postId === postId ? { ...p, isUnread: false } : p
          )
        );
      }, 1000);

      return currentPosts;
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
      // Retry failed items on the next sync interval
      setPendingReadItems((prev) => {
        const newSet = new Set(prev);
        itemsToMark.forEach((item) => newSet.add(item));
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user.valid && groupId) {
        setPage(1);
        fetchMediaItems(groupId, userId, 1, { append: false });
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user.valid, groupId, userId, fetchMediaItems]);

  useEffect(() => {
    if (!scrollToItemId || isLoading) return;

    const element = document.getElementById(scrollToItemId);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth" });
    setScrollToItemId(null);

    if (isPWA) {
      window.history.replaceState(null, null, `/${groupId}/${userId}`);
    }
  }, [scrollToItemId, isLoading, isPWA]);

  if (isInitialLoad && isLoading) {
    return (
      <Page fullHeight>
        <Spinner size="x-large" />
      </Page>
    );
  }

  if (!user.valid) {
    return (
      <Page fullHeight>
        <EmptyCard>
          <p>Sorry, something went wrong.</p>
        </EmptyCard>
      </Page>
    );
  }

  const shouldShowPushNotificationBanner =
    notificationPreference === "PUSH" &&
    isPWA &&
    !isSubscribed &&
    pushPermission !== "denied" &&
    !localPushNotificationsEnabled;

  return (
    <Page>
      <MoreMenu
        visible={isMoreMenuVisible}
        groupId={groupId}
        users={users}
        user={user}
        stats={stats}
        statsIsLoading={statsIsLoading}
        setIsMoreMenuVisible={handleMenuToggle}
        style={{ zIndex: 3 }}
        onNotificationPreferenceChange={setNotificationPreference}
        onUserUpdate={handleUserUpdate}
      />
      <PageContainerInteractionBlocker visible={isMoreMenuVisible} />
      <PageContainer>
        <ButtonContainer>
          {audioRecorder.isRecording ? (
            <RecordingBar
              elapsed={audioRecorder.elapsed}
              onCancel={handleCancelRecording}
              onStop={handleFinishRecording}
            />
          ) : isComposeOpen ? (
            <>
              <Button
                type="icon-small"
                size="large"
                stretch="fit"
                prominence="secondary"
                icon={faXmark}
                key="compose-close"
                onClick={() => setIsComposeOpen(false)}
                aria-label="Close"
              />
              <Button
                disabled={isUploading}
                type="icon"
                size="large"
                stretch="fill"
                prominence="primary"
                icon={faPhotoFilm}
                key="compose-photo"
                aria-label="Add photo or video"
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  multiple
                  disabled={isUploading}
                />
              </Button>
              {audioRecorder.isSupported && (
                <Button
                  type="icon"
                  size="large"
                  stretch="fill"
                  prominence="primary"
                  icon={faMicrophone}
                  key="compose-audio"
                  onClick={handleStartRecording}
                  isLoading={audioRecorder.isStarting}
                  disabled={isUploading}
                  aria-label="Record audio"
                />
              )}
            </>
          ) : (
            <>
              <Button
                type="icon-small"
                size="large"
                stretch="fit"
                prominence="secondary"
                icon={faBars}
                key="menu"
                onClick={handleMenuToggle}
              />
              <Button
                key="new-post"
                disabled={isUploading}
                type="icon"
                size="large"
                stretch="fill"
                prominence="primary"
                icon={faPlus}
                onClick={() => setIsComposeOpen(true)}
                aria-label="New post"
              />
            </>
          )}
        </ButtonContainer>
        {shouldShowPushNotificationBanner && (
          <Banner
            messages={[
              "Get notified about new posts, reactions, and comments!"
            ]}
            button="Enable push notifications"
            onButtonClick={() => setupPushNotifications(groupId, userId)}
            isLoading={
              isSubscriptionLoading ||
              isCheckingSubscription ||
              (pushPermission === "granted" && isSubscribed) ||
              isSettingUpPushNotifications
            }
          />
        )}
        <MediaGrid>
          {mediaItems.map((post, index) => {
            return (
              <MediaPost
                ref={
                  index === mediaItems.length - 1 ? lastMediaElementRef : null
                }
                key={post.postId}
                post={post}
                groupId={groupId}
                user={user}
                users={users}
                isUnread={post.isUnread}
                onLoad={(postId) => markAsRead(postId)}
                isUploadedThisPageLoad={post.isUploadedThisPageLoad}
                isDoneUploading={
                  post.isUploadedThisPageLoad ? post.isDoneUploading : true
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
