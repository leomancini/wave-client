import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Page } from "../components/Page";
import { Spinner } from "../components/Spinner";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 1rem);
  width: 100%;
`;

const GroupList = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

const GroupLink = styled.a`
  text-decoration: none;
  color: inherit;
  width: 100%;
`;

const GroupListItem = styled.div`
  background-color: white;
  border-radius: 2rem;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  width: calc(100% - 3rem);
  padding: 1.5rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  color: inherit;
  min-height: 3rem;

  transition: all 0.2s;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
  transform-origin: center center;
  will-change: transform;
  user-select: none;

  &:active {
    transform: ${(props) => (props.$isLoading ? "none" : "scale(0.95)")};
  }
`;

const GroupName = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  flex: 1;
`;

const GroupValueContainer = styled.div`
  min-width: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const Badge = styled.div`
  background: rgba(0, 122, 255, 1);
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 1);
  font-size: 1rem;
  font-weight: bold;
  min-width: 1rem;
  height: 1.25rem;
  text-align: center;
`;

export const Home = () => {
  const [myGroups] = useState(
    () => JSON.parse(localStorage.getItem("myGroups")) || []
  );
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const promises = myGroups.map((group) =>
          fetch(
            `${process.env.REACT_APP_API_URL}/unread/${group.groupId}/${group.userId}`
          )
            .then((res) => res.json())
            .then((data) => ({
              groupId: group.groupId,
              count: data.unreadCount
            }))
        );

        const results = await Promise.all(promises);
        const counts = results.reduce(
          (acc, { groupId, count }) => ({
            ...acc,
            [groupId]: count
          }),
          {}
        );

        setUnreadCounts(counts);
      } catch (error) {
        console.error("Failed to fetch unread counts:", error);
      }
    };

    fetchUnreadCounts();
  }, [myGroups]);

  return (
    <Page>
      <PageContainer>
        {myGroups.length > 0 ? (
          <GroupList>
            {myGroups.map((data, index) => (
              <GroupLink href={`/${data.groupId}/${data.userId}`} key={index}>
                <GroupListItem>
                  <GroupName>{data.groupId}</GroupName>
                  <GroupValueContainer>
                    {unreadCounts[data.groupId] !== undefined ? (
                      <Badge>{unreadCounts[data.groupId]}</Badge>
                    ) : (
                      <Spinner $size="medium" />
                    )}
                  </GroupValueContainer>
                </GroupListItem>
              </GroupLink>
            ))}
          </GroupList>
        ) : (
          <p>No groups found</p>
        )}
      </PageContainer>
    </Page>
  );
};
