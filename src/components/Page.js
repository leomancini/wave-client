import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  width: calc(100vw - 2rem);
  max-width: 32rem;

  ${(props) =>
    props.$fullHeight &&
    `
      @supports (-webkit-touch-callout: none) {
        padding-bottom: calc(6rem + env(safe-area-inset-bottom));
      }
    `}
`;
