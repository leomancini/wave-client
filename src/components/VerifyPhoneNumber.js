import { useState, useRef, useEffect } from "react";
import { styled } from "styled-components";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import Input, {
  isValidPhoneNumber,
  formatPhoneNumber
} from "react-phone-number-input/input";
import { TextField } from "./TextField";

const VerifiedLabel = styled.div`
  color: rgba(0, 122, 255, 1);
  text-transform: uppercase;
  font-size: 0.8125rem;
  letter-spacing: 0.0125rem;
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-right: 0.25rem;
  height: 2.25rem;
`;

const ErrorLabel = styled.div`
  color: rgba(225, 50, 50, 1);
  text-transform: uppercase;
  font-size: 0.8125rem;
  letter-spacing: 0.0125rem;
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-right: 0.25rem;
  height: 2.25rem;
`;

const VerifyPhoneNumber = ({ groupId, user }) => {
  const [userPhoneNumber, setUserPhoneNumber] = useState(
    user.phoneNumber?.display
  );
  const [shouldShowVerificationCodeInput, setShouldShowVerificationCodeInput] =
    useState(false);
  const [isSubmittingVerificationCode, setIsSubmittingVerificationCode] =
    useState(false);
  const [isPhoneNumberVerified, setIsPhoneNumberVerified] = useState(
    user.phoneNumber?.display !== undefined
  );
  const [isSubmittingPhoneNumber, setIsSubmittingPhoneNumber] = useState(false);
  const [phoneNumberValue, setPhoneNumberValue] = useState();
  const [initialPhoneNumberValue, setInitialPhoneNumberValue] = useState(
    user.phoneNumber?.display
  );
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [verificationCodeValue, setVerificationCodeValue] = useState("");
  const [verificationCodeError, setVerificationCodeError] = useState(false);

  const [
    verificationCodeInputAnimationsEnabled,
    setVerificationCodeInputAnimationsEnabled
  ] = useState(false);

  const verificationCodeInputRef = useRef(null);

  useEffect(() => {
    if (shouldShowVerificationCodeInput && verificationCodeInputRef.current) {
      verificationCodeInputRef.current.focus();
      setVerificationCodeInputAnimationsEnabled(true);
    }
  }, [shouldShowVerificationCodeInput]);

  const phoneNumberIsValid = phoneNumberValue
    ? isValidPhoneNumber(phoneNumberValue.toString())
    : false;

  const onPhoneNumberSubmit = async (phoneNumber) => {
    setIsSubmittingPhoneNumber(true);

    if (phoneNumber === "") {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}/delete-phone-number`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete phone number");
        }

        setUserPhoneNumber("");
        setIsPhoneNumberVerified(false);
      } catch (error) {
        console.error("Error deleting phone number:", error);
        setIsSubmittingPhoneNumber(false);
      } finally {
        setIsSubmittingPhoneNumber(false);
      }
    } else {
      try {
        setPhoneNumberError(false);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}/generate-verification-code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              phoneNumber: {
                display: phoneNumber,
                e164: phoneNumberValue
              }
            })
          }
        );

        if (!response.ok) {
          setPhoneNumberError(true);
          throw new Error("Failed to generate verification code");
        }

        const data = await response.json();

        if (data.success) {
          setUserPhoneNumber(phoneNumber);
          setShouldShowVerificationCodeInput(true);
          setInitialPhoneNumberValue(phoneNumber);
        } else {
          setPhoneNumberError(true);
        }
      } catch (error) {
        console.error("Error generating verification code:", error);
        setPhoneNumberError(true);
        setIsSubmittingPhoneNumber(false);
      } finally {
        setIsSubmittingPhoneNumber(false);
      }
    }
  };

  const onVerificationCodeSubmit = async (verificationCode) => {
    setIsSubmittingVerificationCode(true);

    try {
      setVerificationCodeError(false);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}/verify-verification-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ verificationCode })
        }
      );

      if (!response.ok) {
        setVerificationCodeError(true);
        throw new Error("Failed to verify code");
      }

      const data = await response.json();

      if (data.success) {
        setIsPhoneNumberVerified(true);
        setShouldShowVerificationCodeInput(false);
      } else {
        setVerificationCodeError(true);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setIsSubmittingVerificationCode(false);
      setVerificationCodeError(true);
    } finally {
      setIsSubmittingVerificationCode(false);
      setVerificationCodeValue("");
    }
  };

  const shouldShowVerifiedLabel =
    !isSubmittingPhoneNumber &&
    isPhoneNumberVerified &&
    (phoneNumberValue
      ? formatPhoneNumber(phoneNumberValue)
      : initialPhoneNumberValue) === userPhoneNumber;

  return shouldShowVerificationCodeInput ? (
    <TextField
      ref={verificationCodeInputRef}
      placeholder="Enter verification code..."
      buttonLabel={<FontAwesomeIcon icon={faCheck} />}
      onSubmit={onVerificationCodeSubmit}
      clearValueOnSubmit={verificationCodeError}
      disabled={isSubmittingVerificationCode}
      isLoading={isSubmittingVerificationCode}
      value={verificationCodeValue}
      onChange={setVerificationCodeValue}
      maxLength={6}
      valueIsValid={verificationCodeValue.length === 6}
      inputMode="numeric"
      animationsEnabled={verificationCodeInputAnimationsEnabled}
      autocomplete="one-time-code"
      accessory={
        !isSubmittingVerificationCode &&
        !verificationCodeValue &&
        verificationCodeError && <ErrorLabel>Try again</ErrorLabel>
      }
    />
  ) : (
    <Input
      country="US"
      inputMode="tel"
      value={phoneNumberValue}
      initialValue={initialPhoneNumberValue}
      onChange={setPhoneNumberValue}
      onSubmit={onPhoneNumberSubmit}
      onSubmitSuccess={() => {
        if (verificationCodeInputRef.current) {
          try {
            verificationCodeInputRef.current.focus();
          } catch (e) {
            console.log("Could not auto-focus input - this is expected on iOS");
          }
        }
      }}
      inputComponent={TextField}
      verifyPhoneNumber={true}
      placeholder="Add your phone number..."
      buttonLabel={<FontAwesomeIcon icon={faCheck} />}
      disabled={isSubmittingPhoneNumber}
      isLoading={isSubmittingPhoneNumber}
      clearValueOnSubmit={phoneNumberError}
      valueIsValid={phoneNumberIsValid || !phoneNumberValue}
      accessory={
        phoneNumberError ? (
          <ErrorLabel>Try again</ErrorLabel>
        ) : phoneNumberValue || initialPhoneNumberValue ? (
          shouldShowVerifiedLabel && <VerifiedLabel>Verified</VerifiedLabel>
        ) : null
      }
    />
  );
};

export default VerifyPhoneNumber;
