import { useState, forwardRef, useEffect } from "react";
import styled, { css } from "styled-components";

import TextareaAutosize from "react-textarea-autosize";
import { Spinner } from "./Spinner";

const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  width: 100%;
`;

const InputBase = css`
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 1.375rem;
  padding: 0.75rem 5rem 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.25rem;
  box-sizing: border-box;
  resize: none;
  -webkit-appearance: none;
  transition: ${({ animationsEnabled }) =>
    animationsEnabled
      ? "background 0.2s ease-in-out, color 0.2s ease-in-out"
      : "none"};

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

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px #ececec inset !important;
    -webkit-text-fill-color: inherit !important;
  }

  ${({ disabled }) =>
    disabled &&
    css`
      // background: rgba(0, 0, 0, 0.025);
      background: red;
      color: rgba(0, 0, 0, 0.25);
      cursor: not-allowed;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      opacity: 1;

      &:active,
      &:focus {
        background: rgba(0, 0, 0, 0.025);
      }

      &::placeholder {
        color: rgba(0, 0, 0, 0.2);
      }
    `}
`;

const Input = styled.input`
  ${InputBase}
  height: 2.75rem;
`;

const TextArea = styled(TextareaAutosize)`
  ${InputBase}
  min-height: 2.75rem;
`;

const SpinnerContainer = styled.div`
  position: absolute;
  right: 1rem;
  top: 0.675rem;
`;

const AccessoryContainer = styled.div`
  position: absolute;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
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
  height: 2.25rem;
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
      accessory,
      multiLine = false,
      handleChange,
      disabled = false,
      clearValueOnSubmit = true,
      buttonLabel,
      onSubmit,
      verifyPhoneNumber = false,
      onChange,
      value: externalValue,
      maxLength,
      valueIsValid = true,
      inputMode = "text",
      autocomplete = "off",
      animationsEnabled = true,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue);
    const [previousValue, setPreviousValue] = useState(initialValue);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [shouldShowButton, setShouldShowButton] = useState(false);

    useEffect(() => {
      setValue(initialValue);
      setPreviousValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      const shouldShowButton =
        (previousValue || value) &&
        buttonLabel &&
        !isSubmitted &&
        value !== previousValue &&
        valueIsValid;

      setShouldShowButton(shouldShowButton);
    }, [previousValue, value, buttonLabel, isSubmitted, valueIsValid]);

    const currentValue = value;

    return (
      <TextFieldContainer>
        {multiLine ? (
          <TextArea
            ref={ref}
            id={id}
            value={currentValue}
            placeholder={placeholder}
            maxRows={99999}
            onSelect={(e) => e.preventDefault()}
            isLoading={isLoading}
            inputMode={inputMode}
            pattern={
              inputMode === "numeric" || inputMode === "tel"
                ? "[0-9]*"
                : undefined
            }
            data-1p-ignore
            autoComplete={autocomplete}
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
            readOnly={disabled}
            maxLength={maxLength}
            animationsEnabled={animationsEnabled}
          />
        ) : (
          <Input
            ref={ref}
            id={id}
            value={currentValue}
            placeholder={placeholder}
            onSelect={(e) => e.preventDefault()}
            isLoading={isLoading}
            inputMode={inputMode}
            pattern={
              inputMode === "numeric" || inputMode === "tel"
                ? "[0-9]*"
                : undefined
            }
            data-1p-ignore
            autoComplete={autocomplete}
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
            readOnly={disabled}
            maxLength={maxLength}
            animationsEnabled={animationsEnabled}
          />
        )}
        {isLoading && (
          <SpinnerContainer>
            <Spinner size="small" />
          </SpinnerContainer>
        )}
        {accessory && !shouldShowButton && (
          <AccessoryContainer>{accessory}</AccessoryContainer>
        )}
        {shouldShowButton && (
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
