import React, { useState } from "react";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { useDetectDeviceType } from "../utilities/detectDeviceType";

import { Spinner } from "./Spinner";

const GridContainer = styled.div`
  position: relative;
  border-radius: 2rem;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.05);
`;

const SingleImageContainer = styled.div`
  position: relative;
  width: 100%;
  font-size: 0;
`;

const Grid = styled.div`
  display: grid;
  gap: 2px;
  font-size: 0;

  ${({ count }) => {
    if (count === 2) {
      return `
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr;
      `;
    }
    if (count === 3) {
      return `
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
        & > *:first-child {
          grid-column: 1 / -1;
        }
      `;
    }
    // 4+
    return `
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
    `;
  }}
`;

const GridCell = styled.div`
  position: relative;
  overflow: hidden;

  ${({ fullWidth, count }) => {
    if (fullWidth && count === 3) {
      return `aspect-ratio: 16 / 9;`;
    }
    if (count === 2) {
      return `aspect-ratio: 3 / 4;`;
    }
    if (!fullWidth && count >= 3) {
      return `aspect-ratio: 3 / 4;`;
    }
    return "";
  }}
`;

const GridImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.5s;
  opacity: ${({ isLoaded }) => (isLoaded ? 1 : 0)};
`;

const GridVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.5s;
  opacity: ${({ isLoaded }) => (isLoaded ? 1 : 0)};
`;

const MoreOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  transition: opacity 0.5s, filter 0.5s, transform 0.5s;
  filter: blur(8px);
  transform: scale(1.125);
  transform-origin: center;
  opacity: ${({ isUploadedThisPageLoad }) =>
    isUploadedThisPageLoad ? 0.5 : 1};
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  will-change: transform;
  perspective: 1000;
  -webkit-perspective: 1000;
  box-sizing: border-box;
  user-select: none;

  ${({ isUploadedThisPageLoad, isDoneUploading, isImageLoaded }) => {
    const isVisible = isUploadedThisPageLoad ? isDoneUploading : isImageLoaded;
    return (
      isVisible &&
      `
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  `
    );
  }};
`;

const FullImage = styled.img`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const FullVideo = styled.video`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const Thumbnail = styled.img`
  width: 100%;
  opacity: ${({ isThumbnailLoaded }) => (isThumbnailLoaded ? 1 : 0)};
  transition: opacity 0.2s;
`;

const ImageSpinnerContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
`;

const SinglePhoto = ({
  item,
  mediaUrl,
  thumbnailUrl,
  isUploadedThisPageLoad,
  isDoneUploading,
  postId,
  onDoubleClick,
  isVideo
}) => {
  const deviceType = useDetectDeviceType();
  const isMobile = deviceType === "mobile";
  const [isThumbnailLoaded, setIsThumbnailLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const scrollThreshold = 10;
  const transformRef = React.useRef(null);

  return (
    <SingleImageContainer
      style={{
        aspectRatio: `${item.metadata.dimensions?.width || 1} / ${
          item.metadata.dimensions?.height || 1
        }`,
        pointerEvents: isUploadedThisPageLoad ? "none" : "auto"
      }}
      onClick={(e) => {
        if (isUploadedThisPageLoad) return;
        if (!("ontouchstart" in window)) {
          onDoubleClick(e);
        }
      }}
      onTouchStart={(e) => {
        setTouchStartY(e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (touchStartY === null) return;
        if (Math.abs(e.touches[0].clientY - touchStartY) > scrollThreshold) {
          setTouchStartY(null);
        }
      }}
      onTouchEnd={(e) => {
        if (touchStartY !== null) {
          onDoubleClick(e);
        }
        setTouchStartY(null);
        if (transformRef.current) {
          transformRef.current.resetTransform();
        }
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1.4}
        maxScale={4}
        centerOnInit={true}
        doubleClick={{ disabled: true }}
        disabled={isUploadedThisPageLoad || !isMobile || isVideo}
        ref={transformRef}
        limitToBounds={true}
        panning={{ disabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: "100%", height: "100%" }}
        >
          <ImageContainer
            isUploadedThisPageLoad={isUploadedThisPageLoad}
            isDoneUploading={isDoneUploading}
            isImageLoaded={isImageLoaded}
          >
            {isVideo ? (
              <FullVideo
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setIsImageLoaded(true)}
              />
            ) : (
              <FullImage
                src={mediaUrl}
                alt={postId}
                onLoad={() => setIsImageLoaded(true)}
              />
            )}
            {!isUploadedThisPageLoad && !isVideo && (
              <Thumbnail
                src={thumbnailUrl}
                alt={postId}
                onLoad={() => setIsThumbnailLoaded(true)}
                isThumbnailLoaded={isThumbnailLoaded}
              />
            )}
          </ImageContainer>
        </TransformComponent>
      </TransformWrapper>
      {isUploadedThisPageLoad && !isDoneUploading && (
        <ImageSpinnerContainer>
          <Spinner size="x-large" />
        </ImageSpinnerContainer>
      )}
    </SingleImageContainer>
  );
};

const GridPhoto = ({ mediaUrl, isUploadedThisPageLoad, isVideo }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isVideo) {
    return (
      <GridVideo
        src={mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        isLoaded={isUploadedThisPageLoad ? true : isLoaded}
        onLoadedData={() => setIsLoaded(true)}
      />
    );
  }

  if (isUploadedThisPageLoad) {
    return <GridImage src={mediaUrl} isLoaded={true} />;
  }

  return (
    <>
      <GridImage
        src={mediaUrl}
        isLoaded={isLoaded}
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
};

export const PhotoGrid = ({
  items,
  postId,
  groupId,
  isUploadedThisPageLoad,
  isDoneUploading,
  onDoubleClick,
  getMediaUrl,
  getThumbnailUrl,
  isItemVideo
}) => {
  if (items.length === 1) {
    const item = items[0];
    const isVideo = isItemVideo(item);
    return (
      <GridContainer>
        <SinglePhoto
          item={item}
          mediaUrl={getMediaUrl(item)}
          thumbnailUrl={getThumbnailUrl(item)}
          isUploadedThisPageLoad={isUploadedThisPageLoad}
          isDoneUploading={isDoneUploading}
          postId={postId}
          onDoubleClick={onDoubleClick}
          isVideo={isVideo}
        />
      </GridContainer>
    );
  }

  const displayItems = items.slice(0, 4);
  const remainingCount = items.length - 4;

  return (
    <GridContainer>
      <Grid count={displayItems.length}>
        {displayItems.map((item, index) => (
          <GridCell
            key={item.metadata.itemId}
            fullWidth={index === 0}
            count={displayItems.length}
          >
            <GridPhoto
              mediaUrl={getMediaUrl(item)}
              isUploadedThisPageLoad={isUploadedThisPageLoad}
              isVideo={isItemVideo(item)}
            />
            {index === 3 && remainingCount > 0 && (
              <MoreOverlay>+{remainingCount}</MoreOverlay>
            )}
          </GridCell>
        ))}
      </Grid>
      {isUploadedThisPageLoad && !isDoneUploading && (
        <ImageSpinnerContainer>
          <Spinner size="x-large" />
        </ImageSpinnerContainer>
      )}
    </GridContainer>
  );
};
