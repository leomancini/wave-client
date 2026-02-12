import React, { useState } from "react";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { useDetectDeviceType } from "../utilities/detectDeviceType";

import { Spinner } from "./Spinner";

const GridWrapper = styled.div`
  border-radius: 2rem;

  ${({ isGrid }) => !isGrid && `
    box-shadow: var(--shadow-elevation-1);
  `}
`;

const GridContainer = styled.div`
  position: relative;
  border-radius: 2rem;
  background-color: var(--color-surface);

  ${({ isGrid }) => !isGrid && `
    overflow: hidden;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
    isolation: isolate;
  `}
`;

const SingleImageContainer = styled.div`
  position: relative;
  width: 100%;
  font-size: 0;
`;

const Grid = styled.div`
  display: grid;
  gap: 4px;
  font-size: 0;
  background-color: var(--color-bg);

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

const GridCellWrapper = styled.div`
  box-shadow: var(--shadow-elevation-1);
  overflow: hidden;

  ${({ index, count }) => {
    const outer = '2rem';
    const inner = '0.375rem';

    if (count === 2) {
      if (index === 0) return `border-radius: ${outer} ${inner} ${inner} ${outer};`;
      return `border-radius: ${inner} ${outer} ${outer} ${inner};`;
    }
    if (count === 3) {
      if (index === 0) return `border-radius: ${outer} ${outer} ${inner} ${inner};`;
      if (index === 1) return `border-radius: ${inner} ${inner} ${inner} ${outer};`;
      return `border-radius: ${inner} ${inner} ${outer} ${inner};`;
    }
    if (index === 0) return `border-radius: ${outer} ${inner} ${inner} ${inner};`;
    if (index === 1) return `border-radius: ${inner} ${outer} ${inner} ${inner};`;
    if (index === 2) return `border-radius: ${inner} ${inner} ${inner} ${outer};`;
    return `border-radius: ${inner} ${inner} ${outer} ${inner};`;
  }}

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

const GridCell = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  background-color: var(--color-surface);
  -webkit-mask-image: -webkit-radial-gradient(white, black);
`;

const GridImage = styled.img`
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
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-primary);
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
  pointer-events: none;
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
  imageUrl,
  thumbnailUrl,
  isUploadedThisPageLoad,
  isDoneUploading,
  postId,
  onDoubleClick
}) => {
  const deviceType = useDetectDeviceType();
  const isMobile = deviceType === "mobile";
  const [isThumbnailLoaded, setIsThumbnailLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const scrollThreshold = 10;
  const transformRef = React.useRef(null);
  const isVideo = item.metadata?.mediaType === "video";

  return (
    <SingleImageContainer
      style={{
        aspectRatio: `${item.metadata.dimensions?.width || 1} / ${
          item.metadata.dimensions?.height || 1
        }`,
        pointerEvents: isUploadedThisPageLoad && !isDoneUploading ? "none" : "auto"
      }}
      onClick={(e) => {
        if (isUploadedThisPageLoad && !isDoneUploading) return;
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
        if (!isVideo && transformRef.current) {
          transformRef.current.resetTransform();
        }
      }}
    >
      {isVideo ? (
        <ImageContainer
          isUploadedThisPageLoad={isUploadedThisPageLoad}
          isDoneUploading={isDoneUploading}
          isImageLoaded={isImageLoaded}
        >
          <FullVideo
            src={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsImageLoaded(true)}
          />
          {!isUploadedThisPageLoad && thumbnailUrl && (
            <Thumbnail
              src={thumbnailUrl}
              alt={postId}
              onLoad={() => setIsThumbnailLoaded(true)}
              isThumbnailLoaded={isThumbnailLoaded}
            />
          )}
        </ImageContainer>
      ) : (
        <TransformWrapper
          initialScale={1}
          minScale={1.4}
          maxScale={4}
          centerOnInit={true}
          doubleClick={{ disabled: true }}
          disabled={(isUploadedThisPageLoad && !isDoneUploading) || !isMobile}
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
              <FullImage
                src={imageUrl}
                alt={postId}
                onLoad={() => setIsImageLoaded(true)}
              />
              {!isUploadedThisPageLoad && (
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
      )}
      {isUploadedThisPageLoad && !isDoneUploading && (
        <ImageSpinnerContainer>
          <Spinner size="x-large" />
        </ImageSpinnerContainer>
      )}
    </SingleImageContainer>
  );
};

const GridPhoto = ({ imageUrl, thumbnailUrl, isUploadedThisPageLoad, isDoneUploading, onDoubleClick }) => {
  const deviceType = useDetectDeviceType();
  const isMobile = deviceType === "mobile";
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const scrollThreshold = 10;
  const transformRef = React.useRef(null);

  return (
    <GridCell
      style={{ pointerEvents: isUploadedThisPageLoad && !isDoneUploading ? "none" : "auto" }}
      onClick={(e) => {
        if (isUploadedThisPageLoad && !isDoneUploading) return;
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
        disabled={(isUploadedThisPageLoad && !isDoneUploading) || !isMobile}
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
            <GridImage
              src={imageUrl}
              isLoaded={isImageLoaded || (isUploadedThisPageLoad && isDoneUploading)}
              onLoad={() => setIsImageLoaded(true)}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            />
            {!isUploadedThisPageLoad && thumbnailUrl && (
              <GridImage
                src={thumbnailUrl}
                isLoaded={true}
              />
            )}
            {isUploadedThisPageLoad && (
              <GridImage
                src={imageUrl}
                isLoaded={true}
              />
            )}
          </ImageContainer>
        </TransformComponent>
      </TransformWrapper>
    </GridCell>
  );
};

export const PhotoGrid = ({
  items,
  postId,
  groupId,
  isUploadedThisPageLoad,
  isDoneUploading,
  onDoubleClick,
  getImageUrl,
  getThumbnailUrl
}) => {
  if (items.length === 1) {
    const item = items[0];
    return (
      <GridWrapper>
        <GridContainer>
          <SinglePhoto
            item={item}
            imageUrl={getImageUrl(item)}
            thumbnailUrl={getThumbnailUrl(item)}
            isUploadedThisPageLoad={isUploadedThisPageLoad}
            isDoneUploading={isDoneUploading}
            postId={postId}
            onDoubleClick={onDoubleClick}
          />
        </GridContainer>
      </GridWrapper>
    );
  }

  const displayItems = items.slice(0, 4);
  const remainingCount = items.length - 4;

  return (
    <GridWrapper isGrid>
      <GridContainer isGrid>
        <Grid count={displayItems.length}>
          {displayItems.map((item, index) => (
            <GridCellWrapper
              key={item.metadata.itemId}
              index={index}
              fullWidth={index === 0}
              count={displayItems.length}
            >
              <GridPhoto
                imageUrl={getImageUrl(item)}
                thumbnailUrl={getThumbnailUrl(item)}
                isUploadedThisPageLoad={isUploadedThisPageLoad}
                isDoneUploading={isDoneUploading}
                onDoubleClick={onDoubleClick}
              />
              {index === 3 && remainingCount > 0 && (
                <MoreOverlay>+{remainingCount}</MoreOverlay>
              )}
            </GridCellWrapper>
          ))}
        </Grid>
        {isUploadedThisPageLoad && !isDoneUploading && (
          <ImageSpinnerContainer>
            <Spinner size="x-large" />
          </ImageSpinnerContainer>
        )}
      </GridContainer>
    </GridWrapper>
  );
};
