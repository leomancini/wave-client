import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(100vw - 2rem);
  max-width: 32rem;

  ${(props) =>
    props.$fullHeight &&
    ` 
      height: 100vh;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0;
      bottom: 0;

      @supports (-webkit-touch-callout: none) {
        margin-top: calc(-2rem - 1rem)
      }
    `}
`;
