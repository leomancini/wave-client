import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";

import { CreateGroup } from "./pages/CreateGroup";
import { ViewGroup } from "./pages/ViewGroup";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

function App() {
  const [title, setTitle] = useState("WAVE");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [pathParts, setPathParts] = useState([]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const urlParts = path.substring(1).split("/");
    setPathParts(urlParts);
    const [groupId, userId] = urlParts;

    if (urlParts[0] === "create") {
      setTitle("Create Group");
      return;
    }

    if (!groupId) {
      alert("No group ID");
      return;
    }

    if (!userId) {
      alert("No user ID");
      return;
    }

    const validateUser = async () => {
      try {
        const validateResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/validate-group-user/${groupId}/${userId}`
        );

        const validateData = await validateResponse.json();
        if (!validateResponse.ok || !validateData.valid) {
          alert("Invalid group or user ID");
          return;
        }

        setTitle(groupId);
        setGroupId(groupId);
        setUserId(userId);
      } catch (error) {
        console.error("Error validating user:", error);
        alert("Error validating user");
        return;
      }
    };

    (async () => {
      await validateUser();
    })();
  }, []);

  return (
    <BrowserRouter basename="/">
      <Container>
        {pathParts[0] === "create" ? (
          <CreateGroup />
        ) : (
          groupId && <ViewGroup groupId={groupId} userId={userId} />
        )}
      </Container>
    </BrowserRouter>
  );
}

export default App;
