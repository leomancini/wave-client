import { useState } from "react";
import styled from "styled-components";
import TextareaAutosize from "react-textarea-autosize";

const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  width: 100%;
`;

const Input = styled(TextareaAutosize)`
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 1.25rem;
  padding: 0.625rem 5rem 0.75rem 1rem;
  font-size: 1rem;
  height: 2.5rem;
  line-height: 1.25rem;
  resize: none;
  transition: background 0.2s ease-in-out;

  &::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }

  &:active,
  &:focus {
    background: ${(props) =>
      props.$disabled ? "rgba(0, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.075)"};
    outline: none;
  }

  &::selection {
    background: ${(props) =>
      props.$disabled ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 1)"};
    color: ${(props) => (props.$disabled ? "rgba(0, 0, 0, 0.5)" : "white")};
  }

  ${({ $disabled }) =>
    $disabled &&
    `
      color: rgba(0, 0, 0, 0.25);
      cursor: not-allowed;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    `}

  ${({ $additionalStyles }) => $additionalStyles || ""}
`;

const Button = styled.button`
  background: rgba(0, 0, 0, 1);
  width: 3.5rem;
  color: white;
  border: none;
  border-radius: 3rem;
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
  line-height: 0;
  font-weight: bold;
  position: absolute;
  cursor: pointer;
  right: 0.25rem;
  height: 2.125rem;
  bottom: 0.25rem;
  outline: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &:active,
  &:focus {
    background: rgba(0, 0, 0, 0.75);
  }
`;

export const TextField = ({
  id,
  initialValue = "",
  placeholder,
  onSubmit,
  buttonLabel,
  multiLine = false,
  handleChange,
  disabled = false,
  additionalStyles = ""
}) => {
  const [value, setValue] = useState(initialValue);

  return (
    <TextFieldContainer>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        maxRows={multiLine ? 99999 : 1}
        onSelect={(e) => e.preventDefault()}
        onChange={(e) => {
          setValue(e.target.value);

          if (handleChange) {
            handleChange(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();

            if (buttonLabel) {
              onSubmit(value);
              setValue("");
            }
          }
        }}
        $disabled={disabled}
        $additionalStyles={additionalStyles}
        readOnly={disabled}
        disabled={disabled}
      />
      {value && buttonLabel && (
        <Button
          onClick={() => {
            onSubmit(value);
            setValue("");
          }}
        >
          {buttonLabel}
        </Button>
      )}
    </TextFieldContainer>
  );
};
