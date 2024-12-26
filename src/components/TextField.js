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

export const TextField = ({ placeholder, onSubmit, buttonLabel }) => {
  const [value, setValue] = useState("");

  return (
    <TextFieldContainer>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit(value);
            setValue("");
          }
        }}
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
