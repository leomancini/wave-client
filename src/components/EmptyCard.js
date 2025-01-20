import styled from "styled-components";

export const EmptyCard = styled.div`
  width: 100%;
  min-width: 16rem;
  aspect-ratio: 1;
  max-width: calc(100% - 2rem);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 2rem;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);

  p {
    margin: 0;
    padding: 0 1rem;
    text-align: center;
    font-size: 1.125rem;
    line-height: 1.5rem;
    color: rgba(0, 0, 0, 0.4);
  }
`;

export const InlineEmptyCard = styled.div`
  width: 100%;
  min-width: 16rem;
  max-width: calc(100% - 4rem);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 1rem;
  margin: 0;
  padding: 2rem;
  text-align: center;
  font-size: 1rem;
  line-height: 1.5rem;
  color: rgba(0, 0, 0, 0.5);
`;
