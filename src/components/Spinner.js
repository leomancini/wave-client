import styled from "styled-components";

export const Spinner = styled.div`
  ${({ $size }) => {
    switch ($size) {
      case "x-large":
        return `
          width: 3rem;
          height: 3rem;
          border-width: 4px;
        `;
      case "large":
        return `
          width: 2rem;
          height: 2rem;
          border-width: 3px;
        `;
      case "medium":
        return `
          width: 1.5rem;
          height: 1.5rem;
          border-width: 2px;
        `;
      case "small":
        return `
          width: 1rem;
          height: 1rem;
          border-width: 2px;
        `;
      default:
        return `
          width: 3rem;
          height: 3rem;
          border-width: 4px;
        `;
    }
  }}

  position: relative;
  display: inline-block;
  border-style: solid;
  margin: 0 auto;
  border-color: ${({ $theme }) =>
    $theme === "light" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
  border-top-color: ${({ $theme }) =>
    $theme === "light" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"};

  border-radius: 50%;
  animation: spinner 0.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  box-sizing: border-box;
  transform-origin: center center;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform;

  @keyframes spinner {
    0% {
      transform: translate3d(0, 0, 0) rotateZ(0deg);
    }
    100% {
      transform: translate3d(0, 0, 0) rotateZ(360deg);
    }
  }
`;
