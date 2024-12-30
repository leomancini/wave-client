import { useEffect, useState } from "react";
import styled from "styled-components";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useConfig } from "../contexts/ConfigContext";

import { formatDateTime } from "../utilities/formatDateTime";
import { Button } from "./Button";
import { Separator } from "./Separator";
import { Spinner } from "./Spinner";

const Container = styled.div`
  position: absolute;
  top: 0;
  margin: 1rem;
  padding: 1rem;
  width: calc(100% - 2rem);
  max-width: 32rem;
  height: calc(100% + 2rem);
  background-color: white;
  z-index: 1000;
  transform: translateX(calc(-100% - 5rem)) rotateZ(-10deg);
  opacity: 0;

  ${(props) =>
    props.$visible &&
    `
    transform: translateX(0) rotateZ(0deg);
    opacity: 1;
  `}

  transition: opacity 0.25s linear, transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
  box-sizing: border-box;
  will-change: transform;
  transform-style: preserve-3d;
  backface-visibility: hidden;

  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);

  border-bottom-left-radius: 0;
  border-top-left-radius: 2rem;
  border-bottom-right-radius: 0;
  border-top-right-radius: 2rem;
`;

const Header = styled.div`
  padding: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  height: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
`;

const Content = styled.div`
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
  overflow-y: auto;
  height: calc(100% - 7.5rem);

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const ListItem = styled.div`
  width: 100%;
`;

const ListItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3rem;
  padding: 0.5rem 0;
`;

const ListItemLabel = styled.div`
  font-size: 1rem;
`;

const ListItemValue = styled.div`
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: normal;
`;

export const MoreMenu = ({
  $visible,
  setIsMoreMenuVisible,
  groupId,
  users
}) => {
  const { config } = useConfig();
  const [stats, setStats] = useState({});
  const [statsIsLoading, setStatsIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/stats/${groupId}`
        );
        const data = await response.json();
        setStats(data);
        setStatsIsLoading(false);
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };

    if (!$visible) {
      setStats({});
      setStatsIsLoading(true);
    } else if (groupId) {
      fetchStats();
    }
  }, [groupId, setStats, $visible]);

  return (
    <Container $visible={$visible}>
      <Header>{groupId}</Header>
      <CloseButton>
        <Button
          $type="icon-small"
          $size="large"
          $stretch="fit"
          $prominence="tertiary"
          $icon={faXmark}
          onClick={() => setIsMoreMenuVisible(false)}
        />
      </CloseButton>
      <Content>
        <Section>
          <SectionLabel>Stats</SectionLabel>
          <List>
            <ListItem>
              <ListItemContent>
                <ListItemLabel>Created</ListItemLabel>
                <ListItemValue>
                  {formatDateTime(config.createdAt)}
                </ListItemValue>
              </ListItemContent>
              <Separator />
            </ListItem>
            {statsIsLoading ? (
              <Spinner $size="large" style={{ marginTop: "1.5rem" }} />
            ) : (
              <>
                <ListItem>
                  <ListItemContent>
                    <ListItemLabel>Members</ListItemLabel>
                    <ListItemValue>{stats.userCount}</ListItemValue>
                  </ListItemContent>
                  <Separator />
                </ListItem>
                <ListItem>
                  <ListItemContent>
                    <ListItemLabel>Total Media</ListItemLabel>
                    <ListItemValue>{stats.mediaCount}</ListItemValue>
                  </ListItemContent>
                  <Separator />
                </ListItem>
                <ListItem>
                  <ListItemContent>
                    <ListItemLabel>Total Reactions</ListItemLabel>
                    <ListItemValue>{stats.totalReactions}</ListItemValue>
                  </ListItemContent>
                  <Separator />
                </ListItem>
                {stats.topReactions && stats.topReactions.length > 0 && (
                  <ListItem>
                    <ListItemContent>
                      <ListItemLabel>Top Reactions</ListItemLabel>
                      <ListItemValue>
                        {stats.topReactions.map((reaction) => (
                          <div key={reaction.reaction}>
                            {reaction.reaction} {reaction.count}
                          </div>
                        ))}
                      </ListItemValue>
                    </ListItemContent>
                    <Separator />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemContent>
                    <ListItemLabel>Total Comments</ListItemLabel>
                    <ListItemValue>{stats.totalComments}</ListItemValue>
                  </ListItemContent>
                </ListItem>
              </>
            )}
          </List>
        </Section>
        <Section>
          <SectionLabel>Members</SectionLabel>
          <List>
            {users.map((user, index) => (
              <ListItem key={user.id}>
                <ListItemContent>
                  <ListItemValue>
                    <UserAvatar>
                      {user.name.substring(0, 1).toUpperCase()}
                    </UserAvatar>
                    {user.name}
                  </ListItemValue>
                </ListItemContent>
                {index !== users.length - 1 && <Separator />}
              </ListItem>
            ))}
          </List>
        </Section>
      </Content>
    </Container>
  );
};
