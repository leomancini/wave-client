import React, { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";

import { Spinner } from "./Spinner";

// Only one clip plays at a time. Also lets the recorder pause playback
// before opening the mic (iOS ducks output volume once the mic is live).
const activeAudioElements = new Set();

export const pauseAllAudio = () => {
  activeAudioElements.forEach((audio) => {
    if (!audio.paused) audio.pause();
  });
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Card = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  border-radius: 2rem;
  background-color: var(--color-bg);
  box-shadow: var(--shadow-elevation-1);
  transition: opacity 0.5s;
  opacity: ${({ isPending }) => (isPending ? 0.5 : 1)};
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
`;

const PlayButton = styled.button`
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  background: var(--color-btn-primary-bg);
  color: var(--color-on-primary);
  cursor: pointer;
  outline: none;
  transition: transform 0.2s, background 0.2s;
  touch-action: manipulation;

  svg {
    /* Optically center the play triangle */
    margin-left: ${({ isPlaying }) => (isPlaying ? "0" : "0.125rem")};
  }

  &:active:not(:disabled) {
    transform: scale(0.9);
    background: var(--color-btn-primary-bg-active);
  }

  &:disabled {
    background: var(--color-btn-primary-bg-disabled);
    cursor: default;
  }
`;

const TrackArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* Extra vertical hit area for scrubbing on touch screens */
  padding: 0.75rem 0;
  margin: -0.75rem 0;
  touch-action: pan-y;
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
`;

const Track = styled.div`
  position: relative;
  width: 100%;
  height: 0.375rem;
  border-radius: 0.375rem;
  background-color: var(--color-surface-active);
  overflow: hidden;
`;

const Progress = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 0.375rem;
  background-color: var(--color-primary);
  width: ${({ ratio }) => `${Math.max(0, Math.min(1, ratio)) * 100}%`};
`;

const Times = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 0.875rem;
  line-height: 1rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  padding: 0 0.25rem;
`;

export const AudioPlayer = ({ src, duration: knownDuration, disabled }) => {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const wasPlayingBeforeScrub = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [elementDuration, setElementDuration] = useState(null);
  const [scrubRatio, setScrubRatio] = useState(null);

  // Prefer the duration the server measured. iOS ignores preload="metadata"
  // and won't tell us the duration until playback starts, and Chrome reports
  // Infinity for freshly recorded webm blobs.
  const duration =
    Number.isFinite(knownDuration) && knownDuration > 0
      ? knownDuration
      : Number.isFinite(elementDuration) && elementDuration > 0
      ? elementDuration
      : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    activeAudioElements.add(audio);
    return () => {
      activeAudioElements.delete(audio);
      audio.pause();
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || disabled) return;

    if (audio.paused) {
      pauseAllAudio();
      // play() has to be called synchronously inside the tap handler on iOS
      const result = audio.play();
      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          console.error("Audio playback failed:", error);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  };

  const ratioFromEvent = useCallback((event) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  }, []);

  const seekTo = (ratio) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const target = ratio * duration;
    try {
      audio.currentTime = target;
    } catch (error) {
      // iOS throws if the media isn't ready to seek yet; ignore
    }
    setCurrentTime(target);
  };

  const handlePointerDown = (event) => {
    if (disabled || !duration) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    wasPlayingBeforeScrub.current = !audioRef.current?.paused;
    setScrubRatio(ratioFromEvent(event));
  };

  const handlePointerMove = (event) => {
    if (scrubRatio === null) return;
    setScrubRatio(ratioFromEvent(event));
  };

  const handlePointerUp = (event) => {
    if (scrubRatio === null) return;
    const ratio = ratioFromEvent(event);
    setScrubRatio(null);
    seekTo(ratio);
    if (wasPlayingBeforeScrub.current) {
      const result = audioRef.current?.play();
      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    }
  };

  const displayedTime =
    scrubRatio !== null && duration ? scrubRatio * duration : currentTime;
  const ratio = duration ? displayedTime / duration : 0;

  return (
    <Card isPending={disabled}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) {
            try {
              audioRef.current.currentTime = 0;
            } catch (error) {}
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={() => {
          if (scrubRatio === null && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setElementDuration(audioRef.current.duration);
        }}
        onDurationChange={() => {
          if (audioRef.current) setElementDuration(audioRef.current.duration);
        }}
        onError={() => setIsBuffering(false)}
      />
      <PlayButton
        onClick={togglePlayback}
        disabled={disabled}
        isPlaying={isPlaying}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {disabled ? (
          <Spinner theme="light" size="medium" />
        ) : isBuffering && isPlaying ? (
          <Spinner theme="light" size="medium" />
        ) : (
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        )}
      </PlayButton>
      <TrackArea
        disabled={disabled || !duration}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setScrubRatio(null)}
      >
        <Track ref={trackRef}>
          <Progress ratio={ratio} />
        </Track>
        <Times>
          <span>{formatDuration(displayedTime)}</span>
          <span>{duration ? formatDuration(duration) : "--:--"}</span>
        </Times>
      </TrackArea>
    </Card>
  );
};
