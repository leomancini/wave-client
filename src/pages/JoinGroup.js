import React, { useEffect, useState } from "react";
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

export const JoinGroup = ({ groupId }) => {
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Remove any existing userId from localStorage (from previous implementation)
    const existingUserId = localStorage.getItem("userId");
    if (existingUserId) {
      localStorage.removeItem("userId");
      const myGroups = JSON.parse(localStorage.getItem("myGroups") || "[]");
      if (
        !myGroups.some(
          (group) =>
            group.groupId === groupId && group.userId === existingUserId
        )
      ) {
        myGroups.push({ groupId, userId: existingUserId });
        localStorage.setItem("myGroups", JSON.stringify(myGroups));
      }
    }

    const myGroups = JSON.parse(localStorage.getItem("myGroups") || "[]");
    const existingGroup = myGroups.find((group) => group.groupId === groupId);

    if (existingGroup) {
      window.location.href = `/${groupId}/${existingGroup.userId}`;
    }
  }, [groupId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/join-group`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            groupId,
            userName
          })
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to join group");
      }

      window.location.href = `/${data.groupId}/${data.userId}`;
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Form>
        <TextField
          placeholder="Group name"
          initialValue={groupId}
          disabled={true}
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
          $isLoading={isSubmitting}
          $size="small"
          $type="text"
          $label="Join"
        />
      </Form>
    </Page>
  );
};
