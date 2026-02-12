import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Page } from "../components/Page";
import { Spinner } from "../components/Spinner";
import { UserAvatar } from "../components/UserAvatar";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemValue
} from "../components/List";
import { Button } from "../components/Button";
import { checkGroupRedirect } from "../utilities/groupRedirects";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const GroupList = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
`;

const GroupLink = styled.a`
  text-decoration: none;
  color: inherit;
  width: 100%;
`;

const GroupListItem = styled.div`
  background-color: var(--color-bg);
  border-radius: 2rem;
  box-shadow: var(--shadow-elevation-1-light);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  min-height: 3rem;
  position: relative;
  overflow: hidden;

  transition: all 0.2s;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
  transform-origin: center center;
  will-change: transform;
  user-select: none;

  &:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-elevation-2);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: var(--shadow-elevation-1-active);
    opacity: 0.8;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    width: 2rem;
    height: calc(100% - 4rem);
    pointer-events: none;
    z-index: 1;
  }

  &::before {
    left: -0.125rem;
    background: linear-gradient(to right, var(--color-card-fade) 15%, transparent 100%);
  }

  &::after {
    right: -0.125rem;
    background: linear-gradient(to left, var(--color-card-fade) 15%, transparent 100%);
  }
`;

const GroupHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: calc(100% - 4rem);
  padding: 2rem 2rem 0 2rem;
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
  background: var(--color-accent);
  padding: 0.5rem 0.875rem;
  border-radius: 2rem;
  color: var(--color-on-primary);
  font-size: 1rem;
  font-size: 1rem;
  font-weight: bold;
  min-width: 1rem;
  height: 1.25rem;
  text-align: center;
`;

const UserList = styled(List)`
  margin-top: 0;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  padding: 0 2rem 2rem 2rem;
`;

const UserListItem = styled(ListItem)`
  width: unset;
`;

const UserListItemValue = styled(ListItemValue)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Home = () => {
  const [myGroups, setMyGroups] = useState(
    () => JSON.parse(localStorage.getItem("myGroups")) || []
  );
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupUsers, setGroupUsers] = useState({});

  useEffect(() => {
    const checkGroupRedirects = async () => {
      const updatedGroups = [];
      let hasChanges = false;

      for (const group of myGroups) {
        const redirectInfo = await checkGroupRedirect(group.groupId);
        if (redirectInfo.hasRedirect && redirectInfo.newGroupId) {
          updatedGroups.push({
            ...group,
            groupId: redirectInfo.newGroupId
          });
          hasChanges = true;
        } else {
          updatedGroups.push(group);
        }
      }

      if (hasChanges) {
        setMyGroups(updatedGroups);
        localStorage.setItem("myGroups", JSON.stringify(updatedGroups));
      }
    };

    checkGroupRedirects();
  }, [myGroups]);

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

    const fetchGroupUsers = async () => {
      try {
        const promises = myGroups.map((group) =>
          fetch(`${process.env.REACT_APP_API_URL}/users/${group.groupId}`)
            .then((res) => res.json())
            .then((users) => ({
              groupId: group.groupId,
              users
            }))
        );

        const results = await Promise.all(promises);
        const users = results.reduce(
          (acc, { groupId, users }) => ({
            ...acc,
            [groupId]: users
          }),
          {}
        );

        setGroupUsers(users);
      } catch (error) {
        console.error("Failed to fetch group users:", error);
      }
    };

    const validateGroups = async () => {
      try {
        const validationPromises = myGroups.map(async (group) => {
          try {
            const response = await fetch(
              `${process.env.REACT_APP_API_URL}/validate-group-user/${group.groupId}/${group.userId}`
            );
            const data = await response.json();
            return {
              group,
              isValid: response.ok && data.valid
            };
          } catch (error) {
            console.error(`Error validating group ${group.groupId}:`, error);
            return {
              group,
              isValid: false
            };
          }
        });

        const validationResults = await Promise.all(validationPromises);
        const invalidGroups = validationResults.filter(
          (result) => !result.isValid
        );

        if (invalidGroups.length > 0) {
          console.log(
            `Removing ${invalidGroups.length} invalid groups from localStorage:`,
            invalidGroups.map((result) => result.group.groupId)
          );

          const validGroups = myGroups.filter(
            (group) =>
              validationResults.find(
                (result) =>
                  result.group.groupId === group.groupId &&
                  result.group.userId === group.userId
              )?.isValid
          );

          setMyGroups(validGroups);
          localStorage.setItem("myGroups", JSON.stringify(validGroups));
        }
      } catch (error) {
        console.error("Error validating groups:", error);
      }
    };

    validateGroups();
    fetchUnreadCounts();
    fetchGroupUsers();
  }, [myGroups]);

  return (
    <Page>
      <PageContainer>
        {myGroups.length > 0 && (
          <GroupList>
            {myGroups.map((data, index) => (
              <GroupLink
                href={`/${encodeURIComponent(data.groupId)}/${data.userId}`}
                key={index}
              >
                <GroupListItem>
                  <GroupHeader>
                    <GroupName>{data.groupId}</GroupName>
                    <GroupValueContainer>
                      {unreadCounts[data.groupId] !== undefined &&
                      groupUsers[data.groupId] ? (
                        unreadCounts[data.groupId] > 0 && (
                          <Badge>{unreadCounts[data.groupId]}</Badge>
                        )
                      ) : (
                        <Spinner size="medium" />
                      )}
                    </GroupValueContainer>
                  </GroupHeader>
                  <UserList>
                    {groupUsers[data.groupId]
                      ? groupUsers[data.groupId].map((user, userIndex) => (
                          <UserListItem
                            key={`${data.groupId}-user-${userIndex}`}
                          >
                            <ListItemContent>
                              <UserListItemValue>
                                <UserAvatar>
                                  {user.name.substring(0, 1).toUpperCase()}
                                </UserAvatar>
                                {user.name}
                              </UserListItemValue>
                            </ListItemContent>
                          </UserListItem>
                        ))
                      : null}
                  </UserList>
                </GroupListItem>
              </GroupLink>
            ))}
          </GroupList>
        )}
        <Button
          size="small"
          stretch="fill"
          prominence="secondary"
          label="Create new group"
          onClick={() => {
            window.location.href = "/create-group";
          }}
          style={{ marginTop: myGroups.length > 0 ? "2rem" : "0" }}
        />
      </PageContainer>
    </Page>
  );
};
