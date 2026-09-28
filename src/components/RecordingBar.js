import React from "react";
import styled, { keyframes } from "styled-components";
import { faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";

import { Button } from "./Button";
import { formatDuration } from "./AudioPlayer";

const Bar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const Status = styled.div`
  flex: 1;
  min-width: 0;
  height: 4rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0 1rem;
  box-sizing: border-box;
  border-radius: 2rem;
  background-color: var(--color-btn-secondary-bg);
  color: var(--color-btn-secondary-text);
  font-size: 1.25rem;
  font-weight: bold;
  user-select: none;
  -webkit-user-select: none;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
`;

const Dot = styled.div`
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: var(--color-error);
  animation: ${pulse} 1.2s ease-in-out infinite;
`;

const Time = styled.span`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

export const RecordingBar = ({ elapsed, onCancel, onStop }) => {
  return (
    <Bar>
      <Button
        type="icon-small"
        size="large"
        stretch="fit"
        prominence="secondary"
        icon={faXmark}
        onClick={onCancel}
        aria-label="Cancel recording"
      />
      <Status>
        <Dot />
        <Time>{formatDuration(elapsed)}</Time>
      </Status>
      <Button
        type="icon"
        size="large"
        stretch="fit"
        prominence="primary"
        icon={faCheck}
        onClick={onStop}
        aria-label="Finish recording"
      />
    </Bar>
  );
};
