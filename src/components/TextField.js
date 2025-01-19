import { useState, forwardRef, useEffect } from "react";
import styled from "styled-components";

import TextareaAutosize from "react-textarea-autosize";
import { Spinner } from "./Spinner";

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
  border-radius: 2rem;
  padding: 0.75rem 5rem 0.75rem 1rem;
  font-size: 1rem;
  height: 2.5rem;
  line-height: 1.25rem;
  resize: none;
  transition: background 0.2s ease-in-out, color 0.2s ease-in-out;

  &::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }

  &:active,
  &:focus {
    background: ${(props) =>
      props.disabled ? "rgba(0, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.075)"};
    outline: none;
  }

  &::selection {
    background: ${(props) =>
      props.disabled ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 1)"};
    color: ${(props) => (props.disabled ? "rgba(0, 0, 0, 0.5)" : "white")};
  }

  ${({ disabled }) =>
    disabled &&
    `
      color: rgba(0, 0, 0, 0.25);
      cursor: not-allowed;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      background: rgba(0, 0, 0, 0.025);
      
      &:active, &:focus {
        background: rgba(0, 0, 0, 0.025);
      }

      &::placeholder {
        color: rgba(0, 0, 0, 0.25);
      }
    `}

  ${({ additionalStyles }) => additionalStyles || ""}
`;

const SpinnerContainer = styled.div`
  position: absolute;
  right: 1rem;
  top: 0.675rem;
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

export const TextField = forwardRef(
  (
    {
      initialValue = "",
      id,
      placeholder,
      isLoading,
      multiLine = false,
      handleChange,
      disabled = false,
      additionalStyles = "",
      clearValueOnSubmit = true,
      buttonLabel,
      onSubmit,
      verifyPhoneNumber = false,
      onChange,
      value: externalValue,
      maxLength,
      valueIsValid = true,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue);
    const [previousValue, setPreviousValue] = useState(initialValue);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
      setValue(initialValue);
      setPreviousValue(initialValue);
    }, [initialValue]);

    const currentValue = value;

    return (
      <TextFieldContainer>
        <Input
          ref={ref}
          id={id}
          value={currentValue}
          placeholder={placeholder}
          maxRows={multiLine ? 99999 : 1}
          onSelect={(e) => e.preventDefault()}
          isLoading={isLoading}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }

            setValue(e.target.value);
            setIsSubmitted(false);
            if (handleChange) {
              handleChange(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();

              if (buttonLabel) {
                onSubmit(value);
                setIsSubmitted(true);
              }

              if (clearValueOnSubmit) {
                setValue("");
              } else {
                setPreviousValue(value);
              }
            }
          }}
          disabled={disabled}
          additionalStyles={additionalStyles}
          readOnly={disabled}
          maxLength={maxLength}
        />
        {isLoading && (
          <SpinnerContainer>
            <Spinner size="small" />
          </SpinnerContainer>
        )}
        {(previousValue || value) &&
          buttonLabel &&
          !isSubmitted &&
          value !== previousValue &&
          valueIsValid && (
            <Button
              onClick={() => {
                onSubmit(value);
                setIsSubmitted(true);

                if (clearValueOnSubmit) {
                  setValue("");
                } else {
                  setPreviousValue(value);
                }
              }}
            >
              {buttonLabel}
            </Button>
          )}
      </TextFieldContainer>
    );
  }
);
