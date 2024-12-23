import styled from "styled-components";

export const UploadButton = styled.label`
  margin-bottom: 2.5rem;
  cursor: ${(props) => (props.$isLoading ? "default" : "pointer")};
  background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? 0.5 : 1)});
  height: 4rem;
  line-height: 0.5rem;
  color: rgba(255, 255, 255, 1);
  border: none;
  border-radius: 2rem;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  span {
    height: 100%;
    line-height: 140%;
    font-size: 2.5rem;

    &.loading {
      height: unset;
      line-height: unset;
      font-size: 1.25rem;
    }
  }

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-touch-callout: none;

  transition: transform 0.2s, opacity 0.2s;

  &:active {
    transform: ${(props) => (props.$isLoading ? "none" : "scale(0.95)")};
    opacity: ${(props) => (props.$isLoading ? 0.5 : 0.75)};
  }

  input[type="file"] {
    display: none;
  }
`;
