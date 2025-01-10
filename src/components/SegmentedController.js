import styled from "styled-components";

const SegmentedControllerContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 2rem;
  padding: 0.25rem;
  gap: 0.5rem;
  background: rgba(0, 0, 0, ${(props) => (props.$isLoading ? "0.05" : "0.05")});
  box-sizing: border-box;
`;

const Option = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, ${(props) => (props.$isSelected ? "1" : "0")});
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  border-radius: 2rem;
  cursor: ${(props) => (props.$isSelected ? "default" : "pointer")};
  transition: all 0.2s;
  user-select: none;

  &:active {
    background: rgba(
      0,
      0,
      0,
      ${(props) => (props.$isSelected ? "1" : "0.075")}
    );
    transform: scale(${(props) => (props.$isSelected ? "1" : "0.9")});
  }

  @media (hover: hover) {
    &:hover {
      background: rgba(
        0,
        0,
        0,
        ${(props) => (props.$isSelected ? "1" : "0.075")}
      );
    }
  }
`;

const OptionLabel = styled.div`
  font-weight: bold;
  color: ${(props) => (props.$isSelected ? "#fff" : "rgba(0, 0, 0, 0.75)")};
`;

export const SegmentedController = ({
  options,
  selectedOption,
  setSelectedOption,
  isLoading = false
}) => {
  return (
    <SegmentedControllerContainer $isLoading={isLoading}>
      {options.map((label, index) => {
        const isSelected = label.toUpperCase() === selectedOption.toUpperCase();
        return (
          <Option
            key={`banner-message-${index}`}
            $isSelected={isSelected}
            onClick={() => {
              setSelectedOption(label.toUpperCase());
            }}
          >
            <OptionLabel $isSelected={isSelected}>{label}</OptionLabel>
          </Option>
        );
      })}
    </SegmentedControllerContainer>
  );
};
