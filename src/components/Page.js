import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(100vw - 2rem);
  max-width: 32rem;

  ${(props) =>
    props.fullHeight &&
    ` 
      height: calc(100% - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      justify-content: center;
      align-items: center;
      position: fixed;
      top: env(safe-area-inset-top);
      bottom: env(safe-area-inset-bottom);
    `}
`;
