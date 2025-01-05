import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Spinner } from "./Spinner";

const StyledButton = styled.button`
  position: relative;
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
  min-height: ${(props) => (props.$size === "small" ? "3rem" : "4rem")};
  max-height: ${(props) => (props.$size === "small" ? "3rem" : "4rem")};
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.$isLoading ? "default" : "pointer")};
  pointer-events: ${(props) => (props.$isLoading ? "none" : "auto")};
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  transform-origin: center center;
  will-change: transform;
  perspective: 1000;
  -webkit-perspective: 1000;
  box-sizing: border-box;
  user-select: none;

  &:active {
    transform: ${(props) => (props.$isLoading ? "none" : "scale(0.9)")};
    background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? 0.5 : 0.75)});
    color: ${(props) => {
      switch (props.$prominence) {
        case "primary":
          return "rgba(255, 255, 255, 1)";
        case "secondary":
          return "rgba(0, 0, 0, 1)";
        case "tertiary":
          return "rgba(0, 0, 0, 1)";
        default:
          return "rgba(255, 255, 255, 1)";
      }
    }};
  }

  width: ${(props) => (props.$stretch === "fit" ? "auto" : "100%")};
  min-width: ${(props) =>
    props.$stretch === "fit"
      ? props.$size === "small"
        ? "3rem"
        : "4rem"
      : "auto"};
  padding: ${(props) =>
    props.$stretch === "fit"
      ? props.$type === "icon" || props.$type === "icon-small"
        ? "0"
        : "0 2rem"
      : "0"};

  span {
    ${(props) => {
      switch (props.$type) {
        case "text":
          return `
            font-size: ${props.$size === "large" ? "1.25rem" : "1rem"};
            font-weight: bold;
          `;
        case "icon":
          return `
            font-size: ${props.$size === "large" ? "1.5rem" : "1.25rem"};
          `;
        case "icon-small":
          return `
            font-size: 1.25rem;
          `;
        default:
          return `
            font-size: ${props.$size === "large" ? "1.25rem" : "1rem"};
            font-weight: bold;
          `;
      }
    }}
  }

  ${(props) => {
    const opacity = {
      primary: {
        default: props.$isLoading ? 0.5 : 1,
        hover: props.$isLoading ? 0.25 : 1,
        active: props.$isLoading ? 0.25 : 0.75
      },
      secondary: {
        default: props.$isLoading ? 1 : 0.05,
        hover: props.$isLoading ? 0.025 : 0.075,
        active: props.$isLoading ? 0.025 : 0.1
      },
      tertiary: {
        default: 0,
        hover: 0,
        active: 0
      }
    };

    const type =
      props.$prominence === "secondary"
        ? "secondary"
        : props.$prominence === "tertiary"
        ? "tertiary"
        : "primary";

    return `
      background: rgba(0, 0, 0, ${opacity[type].default});
      color: ${(() => {
        switch (type) {
          case "secondary":
            return "rgba(0, 0, 0, 0.75)";
          case "tertiary":
            return "rgba(0, 0, 0, 0.6)";
          default:
            return "white";
        }
      })()};

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, ${opacity[type].hover});
      }

      &:active:not(:disabled) {
        background: rgba(0, 0, 0, ${opacity[type].active});
      }
    `;
  }}

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;

  input[type="file"] {
    position: absolute;
    opacity: 0;
    cursor: ${(props) => (props.$isLoading ? "default" : "pointer")};
    width: 100%;
    height: 100%;
  }
`;

export const Button = ({ $label, $size, $icon, children, ...props }) => {
  const getContent = () => {
    if (props.$isLoading) {
      return (
        <Spinner
          $theme="light"
          $size={$size === "large" ? "large" : "medium"}
        />
      );
    }

    if ($icon) {
      return (
        <span>
          <FontAwesomeIcon
            icon={$icon}
            size={$size === "large" ? "lg" : "1x"}
          />
          {$label && <span style={{ marginLeft: "0.5rem" }}>{$label}</span>}
        </span>
      );
    }

    return <span>{$label}</span>;
  };

  return (
    <StyledButton $size={$size} {...props}>
      {getContent()}
      {children}
    </StyledButton>
  );
};
