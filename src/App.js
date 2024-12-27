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

  const setPageAndTitle = (pageId) => {
    const currentPageKey = Object.keys(Pages).find(
      (key) => Pages[key].url === pageId
    );

    setPage(pageId);

    if (currentPageKey) {
      setTitle(Pages[currentPageKey].title);
    }
  };

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const urlParts = path.substring(1).split("/");

    if (urlParts.length === 2) {
      // For viewing a specific group
      const [groupId, userId] = urlParts;
      setPage(Pages.ViewGroup.url);
      setTitle(groupId);
      setGroupId(groupId);
      setUserId(userId);

      if (!groupId) {
        alert("No group ID");
        return;
      }

      if (!userId) {
        alert("No user ID");
        return;
      }
    } else {
      // For all other known pages
      const pageId = urlParts[0];
      setPageAndTitle(pageId);
    }
  }, []);

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
