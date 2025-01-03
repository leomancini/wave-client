import { useState } from "react";
import styled from "styled-components";
import TextareaAutosize from "react-textarea-autosize";

const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
`;

const Input = styled(TextareaAutosize)`
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 1.25rem;
  padding: 0.625rem 5rem 0.75rem 1rem;
  font-size: 1rem;
  height: 2.5rem;
  line-height: 1.25rem;
  resize: none;

  &:active,
  &:focus {
    background-color: rgba(0, 0, 0, 0.075);
    outline: none;
  }

  &::selection {
    background-color: rgba(0, 0, 0, 1);
    color: white;
  }

  ${({ disabled }) =>
    disabled &&
    `
      color: rgba(0, 0, 0, 0.25);
      pointer-events: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;

      &:active,
      &:focus {
        background-color: rgba(0, 0, 0, 0.05);
        outline: none;
      }
    `}
`;

const Button = styled.button`
  background-color: rgba(0, 0, 0, 1);
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
    background-color: rgba(0, 0, 0, 0.75);
  }
`;

export const TextField = ({
  initialValue = "",
  placeholder,
  onSubmit,
  buttonLabel,
  multiLine = false,
  handleChange,
  disabled = false
}) => {
  const [value, setValue] = useState(initialValue);

  return (
    <TextFieldContainer>
      <Input
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
