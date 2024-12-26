import { useState } from "react";
import styled from "styled-components";

import { formatDateTime } from "../utilities/formatDateTime";
import { TextField } from "./TextField";
import { Spinner } from "./Spinner";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: ${({ $isEmpty }) => ($isEmpty ? "0" : "0.75rem")};
`;

const ListItem = styled.div`
  min-height: 1.25rem;
  display: flex;
  flex-direction: row;
  gap: 0rem;
  justify-content: space-between;
`;

const CommentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
  justify-content: space-between;
  width: 100%;
`;

const Metadata = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: space-between;
`;

const Name = styled.div`
  font-weight: bold;
`;

const Time = styled.div`
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
`;

const Text = styled.div``;

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
    <CommentContainer>
      <Metadata>
        <Name>{name}</Name>
        <Time>
          {timestamp === "new" ? <Spinner $size="small" /> : timestamp}
        </Time>
      </Metadata>
      <Text>{text}</Text>
    </CommentContainer>
  );
};

export const Comments = ({ item, groupId, userId }) => {
  const [newComments, setNewComments] = useState([]);

  const onSubmit = async (comment) => {
    const timestamp = new Date().toISOString();
    setNewComments([...newComments, { text: comment, timestamp }]);

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

      item.comments.push({
        comment,
        timestamp,
        user: { id: userId, name: "You" }
      });

      setNewComments(newComments.filter((c) => c.timestamp !== timestamp));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Container>
      <List $isEmpty={item.comments.length === 0 && newComments.length === 0}>
        {item.comments.map((comment) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment
              name={comment.user.id === userId ? "You" : comment.user.name}
              text={comment.comment}
              timestamp={formatDateTime(comment.timestamp, "short")}
            />
          </ListItem>
        ))}
        {newComments.map((comment) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment name="You" text={comment.text} timestamp="new" />
          </ListItem>
        ))}
      </List>
      <TextField placeholder="Write a comment..." onSubmit={onSubmit} />
    </Container>
  );
};
