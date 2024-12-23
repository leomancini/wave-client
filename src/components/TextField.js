import { useState } from "react";
import styled from "styled-components";

const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
`;

const Input = styled.input`
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 3rem;
  padding: 0 1.25rem;
  font-size: 1rem;
  height: 2.5rem;
  -webkit-tap-highlight-color: transparent;

  &:active,
  &:focus {
    background-color: rgba(0, 0, 0, 0.075);
    outline: none;
  }
`;

const Button = styled.button`
  background-color: rgba(0, 0, 0, 1);
  width: 3rem;
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
  height: 2rem;
  top: 0.25rem;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &:active,
  &:focus {
    background-color: rgba(0, 0, 0, 0.75);
  }
`;

export const TextField = ({ placeholder, onSubmit }) => {
  const [value, setValue] = useState("");

  return (
    <TextFieldContainer>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit(value);
            setValue("");
          }
        }}
      />
      {value && (
        <Button
          onClick={() => {
            onSubmit(value);
            setValue("");
          }}
        >
          ↑
        </Button>
      )}
    </TextFieldContainer>
  );
};
