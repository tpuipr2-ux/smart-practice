import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #ffffff;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #E5E5EA;
  border-radius: 50%;
  border-top-color: #007AFF;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-left: 16px;
  font-size: 16px;
  color: #8E8E93;
`;

const Loading = () => {
  return (
    <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>Загрузка...</LoadingText>
    </LoadingContainer>
  );
};

export default Loading;