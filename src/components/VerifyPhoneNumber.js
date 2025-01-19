import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import Input, { isValidPhoneNumber } from "react-phone-number-input/input";
import { TextField } from "./TextField";

const VerifyPhoneNumber = ({ groupId, user }) => {
  const [value, setValue] = useState();
  const [isSubmittingPhoneNumber, setIsSubmittingPhoneNumber] = useState(false);
  const phoneNumberIsValid = value
    ? isValidPhoneNumber(value.toString())
    : false;

  const handlePhoneNumberSubmit = async (phoneNumber) => {
    setIsSubmittingPhoneNumber(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${groupId}/${user.id}/phone-number`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ phoneNumber })
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update reactions");
      }
    } catch (error) {
      console.error("Error updating phone number:", error);
      setIsSubmittingPhoneNumber(false);
    } finally {
      setIsSubmittingPhoneNumber(false);
    }
  };

  return (
    <Input
      country="US"
      value={value}
      initialValue={user.phoneNumber}
      onChange={setValue}
      onSubmit={handlePhoneNumberSubmit}
      inputComponent={TextField}
      verifyPhoneNumber={true}
      placeholder="Add your phone number..."
      buttonLabel={<FontAwesomeIcon icon={faCheck} />}
      disabled={isSubmittingPhoneNumber}
      isLoading={isSubmittingPhoneNumber}
      clearValueOnSubmit={false}
      valueIsValid={phoneNumberIsValid || !value}
    />
  );
};

export default VerifyPhoneNumber;
