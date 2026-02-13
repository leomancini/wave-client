import { useState, useRef } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { faCamera, faFaceSmile } from "@fortawesome/free-regular-svg-icons";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { formatDateTime } from "../utilities/formatDateTime";
import { parseUrlsInText } from "../utilities/formatDateTime";

import { TextField } from "./TextField";
import { Spinner } from "./Spinner";
import { Separator } from "./Separator";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: ${({ isEmpty }) => (isEmpty ? "0" : "0.75rem")};
`;

const ListItem = styled.div`
  min-height: 1.25rem;
  display: flex;
  flex-direction: row;
  gap: 0rem;
  justify-content: space-between;
`;

const CommentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.5rem;
  justify-content: space-between;
  width: 100%;
`;

const CommentBody = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  width: 100%;
  align-items: flex-start;
`;

const CommentBodyLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`;

const Metadata = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: space-between;
  height: 1.25rem;
`;

const Name = styled.div`
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
  max-width: calc(100% - 120px);
`;

const MetadataRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

const Time = styled.div`
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
`;

const Text = styled.div`
  user-select: text;

  &::selection {
    background-color: var(--color-selection-bg);
    color: var(--color-selection-text);
  }
`;

const Link = styled.a`
  color: var(--color-link);
  font-weight: 500;
  text-decoration: underline;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }

  &:active {
    color: var(--color-link-active);
  }
`;

const SpinnerContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
`;

const CommentMediaContainer = styled.div`
  display: inline-block;
  align-self: flex-start;
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 0.25rem;
  box-shadow: var(--shadow-comment-media);
`;

const CommentMediaInner = styled.div`
  transition: opacity 0.5s, filter 0.5s, transform 0.5s;
  filter: ${({ isUploading }) => (isUploading ? "blur(8px)" : "blur(0px)")};
  transform: ${({ isUploading }) =>
    isUploading ? "scale(1.125)" : "scale(1)"};
  transform-origin: center;
  opacity: ${({ isUploading }) => (isUploading ? 0.5 : 1)};
`;

const CommentMediaImage = styled.img`
  max-width: 14rem;
  max-height: 14rem;
  border-radius: 0.5rem;
  object-fit: cover;
  display: block;
`;

const CommentMediaVideo = styled.video`
  max-width: 14rem;
  max-height: 14rem;
  border-radius: 0.5rem;
  object-fit: cover;
  display: block;
`;

const PreviewContainer = styled.div`
  position: relative;
  display: inline-block;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: var(--shadow-comment-media);
`;

const PreviewImage = styled.img`
  max-width: 10rem;
  max-height: 10rem;
  object-fit: cover;
  display: block;
`;

const PreviewVideo = styled.video`
  max-width: 10rem;
  max-height: 10rem;
  object-fit: cover;
  display: block;
`;

const RemovePreviewButton = styled.button`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  color: white;
  font-size: 0.85rem;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 0;
`;

const CameraButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-icon-muted);
  font-size: 0.875rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    color: var(--color-icon-muted-active);
  }

  &:disabled {
    color: var(--color-icon-muted-disabled);
    cursor: not-allowed;
  }
`;

const CommentReactionsRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: center;
  min-height: 1.25rem;
`;

const CommentReaction = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.75rem;
`;

const CommentReactionEmoji = styled.span`
  font-size: 0.75rem;
`;

const ReactionButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  align-items: center;
`;

const AddReactionTrigger = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-icon-muted);
  font-size: 0.875rem;
  padding: 0.5rem;
  margin: -0.5rem;
  width: calc(0.875rem + 1rem);
  height: calc(0.875rem + 1rem);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  user-select: none;
  flex-shrink: 0;

  &:active:not(:disabled) {
    color: var(--color-icon-muted-active);
    transform: scale(0.9);
  }

  &:disabled {
    color: var(--color-icon-muted-disabled);
    cursor: not-allowed;
  }
`;

const EmojiOption = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 1.5rem;
  outline: none;
  border: none;
  background-color: var(--color-surface);
  border-radius: 1rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  padding: 0 0.5rem;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
    }
  }

  &:active:not(:disabled) {
    background-color: var(--color-surface-active);
    transform: scale(0.9);
  }

  &.selected {
    background-color: var(--color-reaction-selected-bg);
    box-shadow: var(--shadow-emoji-selected);
  }

  &:disabled {
    background: var(--color-reaction-btn-disabled-bg);
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

const COMMENT_REACTION_EMOJIS = ["❤️", "✅", "😂", "👍", "🙏"];

const Comment = ({
  name,
  text,
  timestamp,
  reactions,
  onReact,
  userId,
  isPendingReaction,
  disabled,
  media,
  groupId
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const lastTapRef = useRef(0);
  const textParts = text ? parseUrlsInText(text) : [];

  const groupedReactions = (reactions || []).reduce((acc, r) => {
    if (!acc[r.reaction]) {
      acc[r.reaction] = { users: [], isPending: r.isPending };
    }
    acc[r.reaction].users.push(r.user.name);
    acc[r.reaction].isPending = acc[r.reaction].isPending || r.isPending;
    return acc;
  }, {});

  const hasUserReaction = (emoji) =>
    (reactions || []).some((r) => r.user.id === userId && r.reaction === emoji);

  const handleEmojiSelect = (emoji) => {
    onReact(emoji);
    setShowEmojiPicker(false);
  };

  const handleDoubleTap = (e) => {
    if (disabled || isPendingReaction || timestamp === "new") return;
    const currentTime = new Date().getTime();
    const isTouch = e.type === "touchend";

    if (isTouch) {
      e.preventDefault();
      if (lastTapRef.current && currentTime - lastTapRef.current < 300) {
        onReact("❤️");
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = currentTime;
      }
    } else {
      if (lastTapRef.current && currentTime - lastTapRef.current < 300) {
        onReact("❤️");
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = currentTime;
      }
    }
  };

  return (
    <CommentContainer>
      <Metadata>
        <Name>{name}</Name>
        <MetadataRight>
          {showEmojiPicker ? (
            <ReactionButtonRow>
              {COMMENT_REACTION_EMOJIS.map((emoji, i) => (
                <EmojiOption
                  key={i}
                  className={hasUserReaction(emoji) ? "selected" : ""}
                  onClick={() => handleEmojiSelect(emoji)}
                  disabled={disabled || isPendingReaction}
                >
                  {emoji}
                </EmojiOption>
              ))}
            </ReactionButtonRow>
          ) : (
            <Time>
              {timestamp === "new" ? (
                <SpinnerContainer>
                  <Spinner size="small" />
                </SpinnerContainer>
              ) : (
                timestamp
              )}
            </Time>
          )}
          {timestamp !== "new" && (
            <AddReactionTrigger
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled || isPendingReaction}
            >
              <FontAwesomeIcon
                icon={showEmojiPicker ? faXmark : faFaceSmile}
              />
            </AddReactionTrigger>
          )}
        </MetadataRight>
      </Metadata>
      <CommentBody onClick={handleDoubleTap} onTouchEnd={handleDoubleTap}>
        <CommentBodyLeft>
          {text && (
            <Text>
              {textParts.map((part, index) =>
                part.type === "link" ? (
                  <Link
                    key={index}
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {part.content}
                  </Link>
                ) : (
                  <span key={index}>{part.content}</span>
                )
              )}
            </Text>
          )}
          {media && media.localUrl && media.isVideo && (
            <CommentMediaContainer>
              <CommentMediaInner isUploading={!media.isDoneUploading}>
                <CommentMediaVideo src={media.localUrl} muted playsInline />
              </CommentMediaInner>
            </CommentMediaContainer>
          )}
          {media && media.localUrl && !media.isVideo && (
            <CommentMediaContainer>
              <CommentMediaInner isUploading={!media.isDoneUploading}>
                <TransformWrapper
                  initialScale={1}
                  minScale={1}
                  maxScale={4}
                  centerOnInit={true}
                  doubleClick={{ disabled: true }}
                  disabled={!media.isDoneUploading}
                  limitToBounds={true}
                  panning={{ disabled: true }}
                >
                  <TransformComponent>
                    <CommentMediaImage src={media.localUrl} alt="" />
                  </TransformComponent>
                </TransformWrapper>
              </CommentMediaInner>
            </CommentMediaContainer>
          )}
          {media && !media.localUrl && media.mediaId && media.mediaType === "video" && (
            <CommentMediaContainer>
              <CommentMediaInner isUploading={false}>
                <CommentMediaVideo
                  src={`${process.env.REACT_APP_API_URL}/comment-media/${groupId}/${media.mediaId}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </CommentMediaInner>
            </CommentMediaContainer>
          )}
          {media && !media.localUrl && media.mediaId && media.mediaType === "image" && (
            <CommentMediaContainer>
              <CommentMediaInner isUploading={false}>
                <TransformWrapper
                  initialScale={1}
                  minScale={1}
                  maxScale={4}
                  centerOnInit={true}
                  doubleClick={{ disabled: true }}
                  limitToBounds={true}
                  panning={{ disabled: true }}
                >
                  <TransformComponent>
                    <CommentMediaImage
                      src={`${process.env.REACT_APP_API_URL}/comment-media/${groupId}/${media.mediaId}`}
                      alt=""
                    />
                  </TransformComponent>
                </TransformWrapper>
              </CommentMediaInner>
            </CommentMediaContainer>
          )}
          {Object.keys(groupedReactions).length > 0 && (
            <CommentReactionsRow>
              {Object.entries(groupedReactions).map(
                ([emoji, { users, isPending }]) => (
                  <CommentReaction key={emoji}>
                    <CommentReactionEmoji>{emoji}</CommentReactionEmoji>
                    {users.join(", ")}
                    {isPending && (
                      <SpinnerContainer>
                        <Spinner size="small" />
                      </SpinnerContainer>
                    )}
                  </CommentReaction>
                )
              )}
            </CommentReactionsRow>
          )}
        </CommentBodyLeft>
      </CommentBody>
    </CommentContainer>
  );
};

export const Comments = ({ postId, post, item, groupId, user, disabled }) => {
  const [newComments, setNewComments] = useState([]);
  const [commentReactions, setCommentReactions] = useState({});
  const [pendingReactions, setPendingReactions] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Support both post-level and legacy item-level
  const targetId = postId || item?.metadata?.itemId;
  const comments = post?.comments || item?.comments || [];
  const apiPath = postId
    ? `${process.env.REACT_APP_API_URL}/media/${groupId}/post/${targetId}/comment`
    : `${process.env.REACT_APP_API_URL}/media/${groupId}/${targetId}/comment`;

  const getReactionsForComment = (commentIndex) => {
    if (commentReactions[commentIndex] !== undefined) {
      return commentReactions[commentIndex];
    }
    return comments[commentIndex]?.reactions || [];
  };

  const addCommentReaction = async (commentIndex, reaction) => {
    const currentReactions = getReactionsForComment(commentIndex);
    let isRemoving = currentReactions.some(
      (r) => r.user.id === user.id && r.reaction === reaction
    );

    setPendingReactions((prev) => ({ ...prev, [commentIndex]: true }));

    // Optimistic update
    setCommentReactions((prev) => {
      const reactions = [...(prev[commentIndex] !== undefined ? prev[commentIndex] : comments[commentIndex]?.reactions || [])];

      if (isRemoving) {
        return {
          ...prev,
          [commentIndex]: reactions
            .filter((r) => !(r.user.id === user.id && r.reaction === reaction))
            .map((r) => (r.user.id === user.id ? { ...r, isPending: true } : r))
        };
      } else {
        const filtered = reactions.filter((r) => r.user.id !== user.id);
        return {
          ...prev,
          [commentIndex]: [
            ...filtered,
            { user, reaction, isPending: true }
          ]
        };
      }
    });

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/${groupId}/post/${targetId}/comment/${commentIndex}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, reaction })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add reaction");
      }

      // Resolve optimistic update
      setCommentReactions((prev) => {
        const reactions = prev[commentIndex] || [];
        return {
          ...prev,
          [commentIndex]: reactions.map((r) =>
            r.isPending ? { ...r, isPending: false } : r
          )
        };
      });
    } catch (error) {
      console.error("Error adding comment reaction:", error);
      // Revert optimistic update
      setCommentReactions((prev) => {
        const original = comments[commentIndex]?.reactions || [];
        return { ...prev, [commentIndex]: original };
      });
    } finally {
      setPendingReactions((prev) => ({ ...prev, [commentIndex]: false }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFilePreview({
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/")
    });
  };

  const clearSelectedFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview.url);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (comment) => {
    const hasMedia = !!selectedFile;
    const hasText = comment && comment.trim().length > 0;

    if (!hasText && !hasMedia) return;

    const timestamp = new Date().toISOString();
    const optimisticMedia = filePreview
      ? {
          localUrl: filePreview.url,
          isVideo: filePreview.isVideo,
          isDoneUploading: false
        }
      : null;

    setNewComments((prev) => [
      ...prev,
      { text: comment || "", timestamp, media: optimisticMedia }
    ]);

    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      let mediaData = null;

      if (hasMedia) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("media", fileToUpload);
        formData.append("userId", user.id);

        const uploadResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/media/${groupId}/post/${targetId}/comment-media`,
          { method: "POST", body: formData }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Failed to upload comment media"
          );
        }

        mediaData = await uploadResponse.json();
        setIsUploading(false);

        // Mark optimistic comment media as done uploading (triggers blur removal)
        setNewComments((prev) =>
          prev.map((c) =>
            c.timestamp === timestamp && c.media
              ? {
                  ...c,
                  media: { ...c.media, isDoneUploading: true }
                }
              : c
          )
        );
      }

      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          comment: comment || "",
          media: mediaData
            ? {
                mediaId: mediaData.mediaId,
                mediaType: mediaData.mediaType,
                dimensions: mediaData.dimensions
              }
            : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      comments.push({
        comment: comment || "",
        timestamp,
        user: { id: user.id, name: user.name },
        reactions: [],
        media: mediaData
          ? {
              mediaId: mediaData.mediaId,
              mediaType: mediaData.mediaType,
              dimensions: mediaData.dimensions,
              localUrl: optimisticMedia?.localUrl,
              isDoneUploading: true
            }
          : undefined
      });

      setNewComments((prev) => prev.filter((c) => c.timestamp !== timestamp));
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(error.message || "Failed to add comment. Please try again.");
      setIsUploading(false);
      setNewComments((prev) => prev.filter((c) => c.timestamp !== timestamp));
    }
  };

  return (
    <Container>
      <List isEmpty={comments.length === 0 && newComments.length === 0}>
        {comments.map((comment, index) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment
              name={comment.user.name}
              text={comment.comment}
              timestamp={formatDateTime(comment.timestamp, "short")}
              reactions={getReactionsForComment(index)}
              onReact={(emoji) => addCommentReaction(index, emoji)}
              userId={user.id}
              isPendingReaction={pendingReactions[index]}
              disabled={disabled}
              media={comment.media}
              groupId={groupId}
            />
          </ListItem>
        ))}
        {newComments.map((comment) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment
              name={user.name}
              text={comment.text}
              timestamp="new"
              reactions={[]}
              onReact={() => {}}
              userId={user.id}
              disabled={disabled}
              media={comment.media}
              groupId={groupId}
            />
          </ListItem>
        ))}
      </List>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <TextField
        id={`post-${targetId}-comment-text-field`}
        placeholder="Write a comment..."
        onSubmit={onSubmit}
        buttonLabel="↑"
        multiLine={true}
        disabled={disabled || isUploading}
        forceShowButton={!!selectedFile}
        leftAccessory={
          !filePreview ? (
            <CameraButton
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <FontAwesomeIcon icon={faCamera} />
            </CameraButton>
          ) : null
        }
        bottomContent={
          filePreview ? (
            <PreviewContainer>
              {filePreview.isVideo ? (
                <PreviewVideo src={filePreview.url} muted />
              ) : (
                <PreviewImage src={filePreview.url} alt="" />
              )}
              <RemovePreviewButton onClick={clearSelectedFile}>
                ✕
              </RemovePreviewButton>
            </PreviewContainer>
          ) : null
        }
      />
    </Container>
  );
};
