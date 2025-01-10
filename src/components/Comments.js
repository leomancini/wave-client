import { useState } from "react";
import styled from "styled-components";

import { formatDateTime } from "../utilities/formatDateTime";

import { TextField } from "./TextField";
import { Spinner } from "./Spinner";
import { Separator } from "./Separator";

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
  height: 1.25rem;
`;

const Name = styled.div`
  font-weight: bold;
`;

const Time = styled.div`
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
`;

const Text = styled.div`
  user-select: text;

  &::selection {
    background-color: rgba(0, 0, 0, 1);
    color: white;
  }
`;

const SpinnerContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
`;

const Comment = ({ name, text, timestamp, disabled }) => {
  return (
    <CommentContainer>
      <Metadata>
        <Name>{name}</Name>
        <Time>
          {timestamp === "new" ? (
            <SpinnerContainer>
              <Spinner $size="small" />
            </SpinnerContainer>
          ) : (
            timestamp
          )}
        </Time>
      </Metadata>
      <Text>{text}</Text>
    </CommentContainer>
  );
};

export const Comments = ({ item, groupId, user, disabled }) => {
  const [newComments, setNewComments] = useState([]);

  const onSubmit = async (comment) => {
    const timestamp = new Date().toISOString();
    setNewComments([...newComments, { text: comment, timestamp }]);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/${groupId}/${item.metadata.itemId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: user.id,
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
        user: { id: user.id, name: user.name }
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
              name={comment.user.name}
              text={comment.comment}
              timestamp={formatDateTime(comment.timestamp, "short")}
            />
          </ListItem>
        ))}
        {newComments.map((comment) => (
          <ListItem key={`comment-${comment.timestamp}`}>
            <Separator />
            <Comment name={user.name} text={comment.text} timestamp="new" />
          </ListItem>
        ))}
      </List>
      <TextField
        id={`item-${item.metadata.itemId}-comment-text-field`}
        placeholder="Write a comment..."
        onSubmit={onSubmit}
        buttonLabel="↑"
        multiLine={true}
        disabled={disabled}
        additionalStyles={
          disabled &&
          "opacity: 0.75; background: rgba(0, 0, 0, 0.025); &:active, &:focus { background: rgba(0, 0, 0, 0.025); }"
        }
      />
    </Container>
  );
};
