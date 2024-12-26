import styled from "styled-components";

export const Spinner = styled.div`
  width: ${({ $size }) => ($size === "small" ? "1rem" : "3rem")};
  height: ${({ $size }) => ($size === "small" ? "1rem" : "3rem")};
  margin: ${({ $size }) => ($size === "small" ? "0" : "2rem")} auto;
  border: ${({ $size }) => ($size === "small" ? "2px" : "4px")} solid
    rgba(0, 0, 0, 0.05);
  border-top: ${({ $size }) => ($size === "small" ? "2px" : "4px")} solid
    rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  animation: spin 0.5s ease-in infinite;
  opacity: ${({ $opacity }) => $opacity || 1};

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
