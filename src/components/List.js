import styled from "styled-components";

export const List = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: -1rem;
  margin-bottom: -1rem;
  align-items: flex-start;
`;

export const ListItem = styled.div`
  width: 100%;
`;

export const ListItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3rem;
  padding: 0.5rem 0;
`;

export const ListItemLabel = styled.div`
  font-size: 1rem;
`;

export const ListItemValue = styled.div`
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 1rem;
`;
