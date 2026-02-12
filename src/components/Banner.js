import styled from "styled-components";

import { Button } from "./Button";

const BannerContainer = styled.div`
  border-radius: 2rem;
  min-height: 4rem;
  padding: 1rem;
  width: calc(100% - 2rem);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: var(--color-bg);
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  ${(props) =>
    props.prominence === "announcement"
      ? `
        box-shadow: var(--color-accent-shadow);
      `
      : props.prominence === "standard"
      ? `
        box-shadow: var(--shadow-elevation-1);
      `
      : ""}

  strong {
    font-weight: bold;
  }
`;

const Label = styled.div`
  background: var(--color-accent);
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  color: var(--color-on-primary-80);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  strong {
    color: var(--color-on-primary);
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
  margin: 0.25rem 0 0.75rem 0;
  padding: 0 1.5rem;

  ${(props) =>
    props.alignment === "center"
      ? `
        justify-content: center;
        align-items: center;
        text-align: center;
      `
      : props.alignment === "left"
      ? `
        justify-content: flex-start;
        align-items: flex-start;
        text-align: left;
      `
      : ""}
`;

const Message = styled.div`
  line-height: 1.25rem;
  font-size: 1rem;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Banner = ({
  prominence = "standard",
  label,
  date,
  messages,
  footer,
  button,
  messagesAlignment = "center",
  onButtonClick,
  isLoading = false
}) => {
  return (
    <BannerContainer prominence={prominence}>
      {label && (
        <Label>
          <strong>{label}</strong> {date}
        </Label>
      )}
      <Messages alignment={messagesAlignment}>
        {messages.map((message, index) => (
          <Message
            key={`banner-message-${index}`}
            dangerouslySetInnerHTML={{ __html: message }}
          />
        ))}
      </Messages>
      {footer && <Footer>{footer}</Footer>}
      {button && (
        <Button
          size="small"
          label={button}
          onClick={onButtonClick}
          isLoading={isLoading}
        />
      )}
    </BannerContainer>
  );
};
