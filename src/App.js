import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";

import { CreateGroup } from "./pages/CreateGroup";
import { ViewGroup } from "./pages/ViewGroup";
import { JoinGroup } from "./pages/JoinGroup";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Pages = {
  CreateGroup: {
    id: "CREATE_GROUP",
    url: "create-group",
    title: "Create Group",
    component: CreateGroup
  },
  ViewGroup: {
    id: "VIEW_GROUP",
    component: ViewGroup
  },
  JoinGroup: {
    id: "JOIN_GROUP",
    component: JoinGroup
  }
};

function App() {
  const [title, setTitle] = useState("WAVE");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState("");

  const setPageAndTitle = (pageId) => {
    const currentPageKey = Object.keys(Pages).find(
      (key) => Pages[key].id === pageId || Pages[key].url === pageId
    );

    if (currentPageKey) {
      setPage(Pages[currentPageKey].id);
      setTitle(Pages[currentPageKey].title);
    } else {
      alert("Invalid page");
      return;
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

      if (userId === "join") {
        setPage(Pages.JoinGroup.id);
        setTitle(groupId);
        setGroupId(groupId);
      } else {
        setPage(Pages.ViewGroup.id);
        setTitle(groupId);
        setGroupId(groupId);
        setUserId(userId);
      }

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
        {page === Pages.CreateGroup.id && <CreateGroup />}
        {page === Pages.ViewGroup.id && (
          <ViewGroup groupId={groupId} userId={userId} />
        )}
        {page === Pages.JoinGroup.id && <JoinGroup groupId={groupId} />}
      </Container>
    </BrowserRouter>
  );
}

export default App;
