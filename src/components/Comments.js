import { useState } from "react";
import styled from "styled-components";

import { formatDateTime } from "../utilities/formatDateTime";
import { TextField } from "./TextField";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0rem;
`;

const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0rem;
  justify-content: space-between;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  justify-content: space-between;
  width: 100%;
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
`;

const Name = styled.div`
  font-weight: bold;
`;

const Text = styled.div``;

const Time = styled.div`
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
`;

const Separator = styled.div`
  &:first-child {
    display: none;
  }

  height: 2px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 1rem;
`;

const Comment = ({ name, text, timestamp }) => {
  return (
    <ContentContainer>
      <Content>
        <Name>{name}</Name>
        <Text>{text}</Text>
      </Content>
      <Time>{timestamp}</Time>
    </ContentContainer>
  );
};

export const Comments = ({ item, groupId, userId }) => {
  const [newComments, setNewComments] = useState([]);

  const onSubmit = async (comment) => {
    setNewComments([...newComments, comment]);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.filename}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            comment
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Container>
      <List>
        {item.comments.map((comment) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment
              name={comment.user.id === userId ? "You" : comment.user.name}
              text={comment.comment}
              timestamp={formatDateTime(comment.timestamp)}
            />
          </ListItem>
        ))}
        {newComments.map((comment) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment
              name="You"
              text={comment}
              timestamp={formatDateTime(new Date().getTime())}
            />
          </ListItem>
        ))}
      </List>
      <TextField placeholder="Write a comment..." onSubmit={onSubmit} />
    </Container>
  );
};
