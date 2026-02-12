import styled from "styled-components";

export const Separator = styled.div`
  &:first-child {
    display: none;
  }

  height: 2px;
  width: 100%;
  background-color: var(--color-separator);
  border-radius: 1rem;
`;
