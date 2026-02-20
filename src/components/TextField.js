import { useState, forwardRef, useEffect, useRef, useCallback } from "react";
import styled, { css } from "styled-components";

import TextareaAutosize from "react-textarea-autosize";
import { Spinner } from "./Spinner";

const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  width: 100%;
  font-size: 0;
`;

const InputBase = css`
  width: 100%;
  background: var(--color-surface);
  color: var(--color-primary);
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
    color: var(--color-text-placeholder);
  }

  &:active,
  &:focus {
    background: ${(props) =>
      props.disabled ? "var(--color-surface)" : "var(--color-surface-hover)"};
    outline: none;
  }

  &::selection {
    background: ${(props) =>
      props.disabled
        ? "var(--color-surface-active)"
        : "var(--color-selection-bg)"};
    color: ${(props) =>
      props.disabled ? "var(--color-text-muted)" : "var(--color-selection-text)"};
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px var(--color-autofill-shadow) inset !important;
    -webkit-text-fill-color: inherit !important;
  }

  ${({ disabled }) =>
    disabled &&
    css`
      background: var(--color-surface-disabled);
      color: var(--color-text-disabled);
      cursor: not-allowed;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      opacity: 1;

      &:active,
      &:focus {
        background: var(--color-surface-disabled);
      }

      &::placeholder {
        color: var(--color-text-placeholder-disabled);
      }
    `}

  ${({ hasLabel }) =>
    hasLabel &&
    css`
      padding-left: 5rem;
    `}

  ${({ hasLeftAccessory }) =>
    hasLeftAccessory &&
    css`
      padding-left: 2.75rem;
    `}

  ${({ hasTopContent }) =>
    hasTopContent &&
    css`
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    `}

  ${({ hasBottomContent }) =>
    hasBottomContent &&
    css`
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
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

const HighlightOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  color: ${({ $textColor }) => $textColor || "var(--color-primary)"};
  font-size: 1rem;
  line-height: 1.25rem;
  font-family: inherit;
  border: none;
  border-radius: 1.375rem;
  box-sizing: border-box;

  ${({ $hasLabel }) =>
    $hasLabel
      ? css`
          padding: 0.75rem 5rem 0.75rem 5rem;
        `
      : css`
          padding: 0.75rem 5rem 0.75rem 1rem;
        `}

  ${({ $hasLeftAccessory }) =>
    $hasLeftAccessory &&
    css`
      padding-left: 2.75rem;
    `}
`;

const SpinnerContainer = styled.div`
  position: absolute;
  right: 1rem;
  top: 0.675rem;
`;

const AccessoryContainer = styled.div`
  position: absolute;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  height: auto;
  display: flex;
  align-items: center;
  z-index: 2;
`;

const LeftAccessoryContainer = styled.div`
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  z-index: 2;
`;

const TopContentContainer = styled.div`
  background: var(--color-surface);
  border-top-left-radius: 1.375rem;
  border-top-right-radius: 1.375rem;
  padding: 0.75rem 0.75rem 0.25rem 0.75rem;
`;

const BottomContentContainer = styled.div`
  background: var(--color-surface);
  border-bottom-left-radius: 1.375rem;
  border-bottom-right-radius: 1.375rem;
  padding: 0.25rem 0.75rem 0.75rem 0.75rem;
  overflow: hidden;
  transition: background 0.2s ease-in-out;

  ${({ isFocused }) =>
    isFocused &&
    css`
      background: var(--color-surface-hover);
    `}
`;

const InlineLabel = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  font-weight: bold;
  pointer-events: none;
  z-index: 1;
`;

const Button = styled.button`
  background: var(--color-btn-primary-bg);
  width: 3.5rem;
  color: var(--color-on-primary);
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
    background: var(--color-btn-primary-bg-active);
  }
`;

export const TextField = forwardRef(
  (
    {
      label,
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
      forceShowButton = false,
      leftAccessory,
      topContent,
      bottomContent,
      renderHighlight,
      transformValue,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue);
    const [previousValue, setPreviousValue] = useState(initialValue);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [shouldShowButton, setShouldShowButton] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const highlightRef = useRef(null);
    const internalRef = useRef(null);

    const mergeRefs = useCallback(
      (node) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Sync scroll position between textarea and highlight overlay
    const syncScroll = useCallback(() => {
      if (internalRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = internalRef.current.scrollTop;
      }
    }, []);

    useEffect(() => {
      setValue(initialValue);
      setPreviousValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      const shouldShowButton =
        (forceShowButton && buttonLabel) ||
        ((previousValue || value) &&
          buttonLabel &&
          !isSubmitted &&
          value !== previousValue &&
          valueIsValid);

      setShouldShowButton(shouldShowButton);
    }, [previousValue, value, buttonLabel, isSubmitted, valueIsValid, forceShowButton]);

    const currentValue = value;

    return (
      <TextFieldContainer>
        {topContent && (
          <TopContentContainer>{topContent}</TopContentContainer>
        )}
        <div style={{ position: "relative" }}>
          {leftAccessory && (
            <LeftAccessoryContainer>{leftAccessory}</LeftAccessoryContainer>
          )}
          {label && <InlineLabel>{label}</InlineLabel>}
          {multiLine ? (
            <>
              <TextArea
                ref={mergeRefs}
                id={id}
                value={currentValue}
                placeholder={placeholder}
                maxRows={99999}
                isLoading={isLoading}
                inputMode={inputMode}
                pattern={
                  inputMode === "numeric" || inputMode === "tel"
                    ? "[0-9]*"
                    : undefined
                }
                data-1p-ignore
                autoComplete={autocomplete}
                hasLabel={!!label}
                hasLeftAccessory={!!leftAccessory}
                hasTopContent={!!topContent}
                hasBottomContent={!!bottomContent}
                hasAccessory={!!accessory && !shouldShowButton}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onScroll={renderHighlight ? syncScroll : undefined}
                onChange={(e) => {
                  let newValue = e.target.value;

                  if (transformValue) {
                    const transformed = transformValue(newValue);
                    if (transformed !== newValue) {
                      const cursorPos = e.target.selectionStart;
                      const lengthDiff = transformed.length - newValue.length;
                      newValue = transformed;
                      // Restore cursor position after React re-render
                      requestAnimationFrame(() => {
                        if (internalRef.current) {
                          const newPos = cursorPos + lengthDiff;
                          internalRef.current.setSelectionRange(newPos, newPos);
                        }
                      });
                    }
                  }

                  if (onChange) {
                    onChange(newValue);
                  }

                  if (handleChange) {
                    handleChange(newValue);
                  }

                  setValue(newValue);
                  setIsSubmitted(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();

                    if (buttonLabel && shouldShowButton) {
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
                style={
                  renderHighlight
                    ? {
                        color: "transparent",
                        caretColor: "var(--color-primary)"
                      }
                    : undefined
                }
              />
              {renderHighlight && (
                <HighlightOverlay
                  ref={highlightRef}
                  $hasLabel={!!label}
                  $hasLeftAccessory={!!leftAccessory}
                  $textColor={
                    disabled
                      ? "var(--color-text-disabled)"
                      : "var(--color-primary)"
                  }
                >
                  {renderHighlight(currentValue)}
                </HighlightOverlay>
              )}
            </>
          ) : (
            <Input
              ref={ref}
              label={label}
              id={id}
              value={currentValue}
              placeholder={placeholder}
              isLoading={isLoading}
              inputMode={inputMode}
              pattern={
                inputMode === "numeric" || inputMode === "tel"
                  ? "[0-9]*"
                  : undefined
              }
              data-1p-ignore
              autoComplete={autocomplete}
              hasLabel={!!label}
              hasLeftAccessory={!!leftAccessory}
              hasTopContent={!!topContent}
              hasBottomContent={!!bottomContent}
              hasAccessory={!!accessory && !shouldShowButton}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => {
                if (onChange) {
                  onChange(e.target.value);
                }

                if (handleChange) {
                  handleChange(e.target.value);
                }

                setValue(e.target.value);
                setIsSubmitted(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  if (buttonLabel && shouldShowButton) {
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
        </div>
        {bottomContent && (
          <BottomContentContainer isFocused={isFocused}>
            {bottomContent}
          </BottomContentContainer>
        )}
      </TextFieldContainer>
    );
  }
);
