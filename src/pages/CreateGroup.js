import React, { useState } from "react";
import styled from "styled-components";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
`;

export const CreateGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/create-group`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            groupName,
            userName
          })
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to create group");
      }

      window.location.href = `/${data.groupId}/${data.userId}`;
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Form>
        <TextField
          placeholder="Group name"
          value={groupName}
          handleChange={setGroupName}
          maxLength={50}
        />
        <TextField
          placeholder="Your name"
          value={userName}
          handleChange={setUserName}
          maxLength={50}
        />
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          isLoading={isSubmitting}
          size="small"
          type="text"
          label="Create"
        />
      </Form>
    </Page>
  );
};
