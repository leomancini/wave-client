import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import styled from "styled-components";

const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  width: calc(100vw - 2rem);
  max-width: 32rem;
`;

const UploadButton = styled.label`
  margin-bottom: 2.5rem;
  cursor: ${(props) => (props.$isLoading ? "default" : "pointer")};
  font-size: 2.5rem;
  background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? 0.5 : 1)});
  color: rgba(255, 255, 255, 1);
  padding: 0.25rem 1rem 0.75rem 1rem;
  border: none;
  border-radius: 2rem;
  width: calc(100% - 2rem);
  display: flex;
  justify-content: center;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-touch-callout: none;

  transition: transform 0.2s, opacity 0.2s;

  &:active {
    transform: ${(props) => (props.$isLoading ? "none" : "scale(0.95)")};
    opacity: ${(props) => (props.$isLoading ? 0.5 : 0.75)};
  }

  input[type="file"] {
    display: none;
  }
`;

const MediaGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const MediaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  img {
    border-radius: 2rem;
    width: 100%;
    box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    margin: 0;
  }
`;

const MediaDetails = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 1rem;
  padding: 0 1rem;
  margin-bottom: 1.5rem;
`;

const Name = styled.p`
  font-weight: bold;
`;

const Time = styled.p`
  color: rgba(0, 0, 0, 0.5);
`;

function App() {
  const [, setSelectedFile] = useState(null);
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    const path = new URL(url).pathname;
    const pathParts = path.substring(1).split("/");
    const [groupId, userId] = pathParts;

    if (groupId) {
      setGroupId(groupId);
      setUserId(userId);
      fetchMediaItems(groupId);
    } else {
      alert("No group selected!");
      return;
    }
  }, []);

  const fetchMediaItems = async (groupId) => {
    try {
      const response = await fetch(
        `https://wave-server.noshado.ws/media/${groupId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data.media);
      }
    } catch (error) {
      console.error("Error fetching media items:", error);
    }
  };

  const handleFileUpload = async (event) => {
    if (isUploading) return;

    setIsUploading(true);
    const files = event.target.files;

    if (files.length === 0) return;

    if (files.length === 1) {
      setSelectedFile(files[0]);
    }

    const formData = new FormData();
    const filesArray = Array.from(files);

    filesArray.forEach((file) => {
      const renamedFile = new File(
        [file],
        `${groupId}-${userId}-${file.name}`,
        {
          type: file.type
        }
      );
      formData.append("media", renamedFile);
    });

    formData.append("group", groupId);
    formData.append("uploaderId", userId);

    try {
      const response = await fetch("http://localhost:3107/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log(data);

      fetchMediaItems(groupId);
    } catch (error) {
      alert("Sorry, something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDateTime = (date) => {
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const formattedTime = new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    return `${formattedDate} at ${formattedTime}`;
  };

  return (
    <BrowserRouter basename="/">
      <Page>
        {groupId && (
          <Container>
            <UploadButton $isLoading={isUploading}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                multiple
                disabled={isUploading}
              />
              {isUploading ? "..." : "+"}
            </UploadButton>
            <MediaGrid>
              {mediaItems.map((item, index) => (
                <MediaItem key={index}>
                  <img
                    src={`http://localhost:3107/media/${groupId}/${item.filename}`}
                    alt={item.filename}
                  />
                  <MediaDetails>
                    <Name>{item.uploader.name}</Name>
                    <Time>{formatDateTime(item.created)}</Time>
                  </MediaDetails>
                </MediaItem>
              ))}
            </MediaGrid>
          </Container>
        )}
      </Page>
    </BrowserRouter>
  );
}

export default App;
