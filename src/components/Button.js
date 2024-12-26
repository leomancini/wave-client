import React from "react";
import styled from "styled-components";

import { Spinner } from "./Spinner";

const StyledButton = styled.button`
  position: relative;
  margin-bottom: 2.5rem;
  background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? 0.5 : 1)});
  line-height: 0.5rem;
  color: rgba(255, 255, 255, 1);
  border: none;
  border-radius: 2rem;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: ${(props) => (props.$size === "small" ? "3rem" : "4rem")};
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.$isLoading ? "default" : "pointer")};
  pointer-events: ${(props) => (props.$isLoading ? "none" : "auto")};
  transition: transform 0.2s, opacity 0.2s;

  &:active {
    transform: ${(props) => (props.$isLoading ? "none" : "scale(0.95)")};
    background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? 0.5 : 0.75)});
  }

  span {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;

    ${(props) => {
      switch (props.$type) {
        case "text":
          return `
            font-size: ${props.$size === "large" ? "1.25rem" : "1rem"};
            font-weight: bold;
          `;
        case "icon":
          return `
            font-size: ${props.$size === "large" ? "2.5rem" : "2rem"};
            margin-top: -0.5rem;
          `;
        default:
          return `
            font-size: ${props.$size === "large" ? "1.25rem" : "1rem"};
            font-weight: bold;
          `;
      }
    }}
  }

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-touch-callout: none;

  input[type="file"] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
  }
`;

export const Button = ({ $label, $size, children, ...props }) => {
  return (
    <StyledButton $size={$size} {...props}>
      {props.$isLoading ? (
        <Spinner
          $theme="light"
          $size={$size === "large" ? "large" : "medium"}
        />
      ) : (
        <span>{$label}</span>
      )}
      {children}
    </StyledButton>
  );
};
