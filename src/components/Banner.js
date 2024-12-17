import styled from "styled-components";

export const Banner = (label, date, messages, footer) => {
  return (
    <BannerContainer>
      <Label>
        <strong>{label}</strong> {date}
      </Label>
      {messages.map((message) => (
        <p>{message}</p>
      ))}
      {footer && <strong>{footer}</strong>}
    </BannerContainer>
  );
};

const BannerContainer = styled.div`
  min-height: 4rem;
  padding: 1rem 2rem 1.25rem 2rem;
  width: calc(100% - 4rem);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0px 0px 24px rgba(0, 122, 255, 0.5),
    0px 2px 4px rgba(0, 122, 255, 0.25);
  gap: 0.75rem;

  p,
  strong {
    margin: 0;
    line-height: 1.25rem;
    font-size: 1rem;
    text-align: center;
  }

  p {
    font-weight: medium;
  }

  strong {
    font-weight: bold;
  }
`;

const Label = styled.div`
  background: rgba(0, 122, 255, 1);
  padding: 0.75rem 1rem;
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: medium;
  margin-bottom: 0.5rem;

  strong {
    color: rgba(255, 255, 255, 1);
    font-weight: bold;
    margin: 0;
    padding: 0;
    font-size: 1rem;
    line-height: 0.75rem;
    margin-right: 0.25rem;
  }
`;
