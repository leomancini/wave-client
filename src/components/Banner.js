import styled from "styled-components";

const BannerContainer = styled.div`
  border-radius: 2rem;
  min-height: 4rem;
  padding: 1rem;
  width: calc(100% - 2rem);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0px 0px 24px rgba(0, 122, 255, 0.5),
    0px 2px 4px rgba(0, 122, 255, 0.25);
  gap: 0.75rem;
  margin-bottom: 0.5rem;

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
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: medium;
  margin-bottom: 0.5rem;

  strong {
    color: rgba(255, 255, 255, 1);
    font-size: 0.875rem;
    font-weight: bold;
    margin: 0;
    padding: 0;
    line-height: 0.75rem;
    margin-right: 0.25rem;
  }
`;

const Messages = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0.5rem;

  ${(props) =>
    props.alignment === "center"
      ? `
        justify-content: center;
        align-items: center;
      `
      : props.alignment === "left"
      ? `
        justify-content: flex-start;
        align-items: flex-start;
      `
      : ""}
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Banner = ({
  label,
  date,
  messages,
  footer,
  messagesAlignment
}) => {
  return (
    <BannerContainer>
      <Label>
        <strong>{label}</strong> {date}
      </Label>
      <Messages alignment={messagesAlignment}>
        {messages.map((message, index) => (
          <p
            key={`banner-message-${index}`}
            dangerouslySetInnerHTML={{ __html: message }}
          />
        ))}
      </Messages>
      {footer && <Footer>{footer}</Footer>}
    </BannerContainer>
  );
};
