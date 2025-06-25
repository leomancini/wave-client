import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Page } from "../components/Page";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { handleGroupRedirect } from "../utilities/groupRedirects";

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
    const checkRedirectAndInitialize = async () => {
      // First check if this group has been renamed
      const wasRedirected = await handleGroupRedirect(groupId, "/join");
      if (wasRedirected) {
        return; // Exit early since we're redirecting
      }

      // Continue with existing logic if no redirect
      // Remove any existing userId from localStorage (from previous implementation)
      const existingUserId = localStorage.getItem("userId");
      if (existingUserId) {
        localStorage.removeItem("userId");

        // Validate the existing group before adding it to localStorage
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/validate-group-user/${groupId}/${existingUserId}`
          );
          const data = await response.json();

          if (response.ok && data.valid) {
            const myGroups = JSON.parse(
              localStorage.getItem("myGroups") || "[]"
            );
            if (
              !myGroups.some(
                (group) =>
                  group.groupId === groupId && group.userId === existingUserId
              )
            ) {
              myGroups.push({ groupId, userId: existingUserId });
              localStorage.setItem("myGroups", JSON.stringify(myGroups));
            }
          } else {
            console.log(
              `Invalid group ${groupId} for user ${existingUserId}, not adding to localStorage`
            );
          }
        } catch (error) {
          console.error(`Error validating group ${groupId}:`, error);
        }
      }

      const myGroups = JSON.parse(localStorage.getItem("myGroups") || "[]");
      const existingGroup = myGroups.find((group) => group.groupId === groupId);

      if (existingGroup) {
        // Validate the existing group before redirecting
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/validate-group-user/${groupId}/${existingGroup.userId}`
          );
          const data = await response.json();

          if (response.ok && data.valid) {
            window.location.href = `/${groupId}/${existingGroup.userId}`;
          } else {
            console.log(
              `Invalid group ${groupId} for user ${existingGroup.userId}, removing from localStorage`
            );
            const updatedGroups = myGroups.filter(
              (group) =>
                !(
                  group.groupId === groupId &&
                  group.userId === existingGroup.userId
                )
            );
            localStorage.setItem("myGroups", JSON.stringify(updatedGroups));
          }
        } catch (error) {
          console.error(`Error validating group ${groupId}:`, error);
          // If validation fails, remove the group from localStorage to be safe
          const updatedGroups = myGroups.filter(
            (group) =>
              !(
                group.groupId === groupId &&
                group.userId === existingGroup.userId
              )
          );
          localStorage.setItem("myGroups", JSON.stringify(updatedGroups));
        }
      }
    };

    checkRedirectAndInitialize();
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
          isLoading={isSubmitting}
          size="small"
          type="text"
          label="Join"
        />
      </Form>
    </Page>
  );
};
