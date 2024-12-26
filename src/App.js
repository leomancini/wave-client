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

const Pages = {
  CreateGroup: {
    url: "create-group",
    title: "Create Group",
    component: CreateGroup
  },
  ViewGroup: {
    component: ViewGroup
  }
};

function App() {
  const [title, setTitle] = useState("WAVE");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState("");

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const urlParts = path.substring(1).split("/");

    if (urlParts.length === 2) {
      const [groupId, userId] = urlParts;
      setPage(Pages.ViewGroup.url);

      if (!groupId) {
        alert("No group ID");
        return;
      }

      if (!userId) {
        alert("No user ID");
        return;
      }

      const init = async () => {
        await validateUser(groupId, userId);
      };

      init();
      return;
    }

    const currentPageKey = Object.keys(Pages).find(
      (key) => Pages[key].url === urlParts[0]
    );

    setPage(urlParts[0]);

    if (currentPageKey) {
      setTitle(Pages[currentPageKey].title);
    }
  }, []);

  const validateUser = async (groupId, userId) => {
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
    }
  };

  return (
    <BrowserRouter basename="/">
      <Container>
        {page === Pages.CreateGroup.url && <CreateGroup />}
        {page === Pages.ViewGroup.url && (
          <ViewGroup groupId={groupId} userId={userId} />
        )}
      </Container>
    </BrowserRouter>
  );
}

export default App;
