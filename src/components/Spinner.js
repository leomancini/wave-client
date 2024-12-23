import styled from "styled-components";

export const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  margin: 2rem auto;
  border: 4px solid rgba(0, 0, 0, 0.05);
  border-top: 4px solid rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  animation: spin 0.5s ease-in infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
