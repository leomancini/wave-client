import styled from "styled-components";

const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 1rem;
  font-weight: 600;
`;

const Input = styled.input`
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  padding: 0.5rem;
`;

export const TextField = (label, value) => {
  return (
    <TextFieldContainer>
      <Label>{label}</Label>
      <Input value={value} />
    </TextFieldContainer>
  );
};
