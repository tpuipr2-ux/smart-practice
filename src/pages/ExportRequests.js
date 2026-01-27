import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #000000;
`;

const RequestCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const VacancyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0;
  flex: 1;
`;

const CompanyInfo = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const PartnerInfo = styled.div`
  font-size: 14px;
  color: #007AFF;
  margin-bottom: 8px;
`;

const RequestDate = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const DownloadButton = styled(Button)`
  background-color: #007AFF;
  color: white;

  &:hover {
    background-color: #0056CC;
  }
`;

const SentButton = styled(Button)`
  background-color: #34C759;
  color: white;

  &:hover {
    background-color: #28A745;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #8E8E93;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ExportRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await axios.get('/curator/export-requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error loading export requests:', error);
    }
    setLoading(false);
  };

  const handleDownload = (vacancyId) => {
    // Open download in new window
    window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/curator/export/${vacancyId}/download`);
  };

  const handleMarkSent = async (vacancyId) => {
    try {
      await axios.put(`/curator/export/${vacancyId}/sent`);
      loadRequests(); // Reload list
    } catch (error) {
      console.error('Error marking as sent:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Title>Запросы на выгрузку</Title>
      
      {requests.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📧</EmptyIcon>
          <h3>Нет активных запросов</h3>
          <p>Новые запросы появятся здесь</p>
        </EmptyState>
      ) : (
        requests.map(request => (
          <RequestCard key={request.id}>
            <RequestHeader>
              <VacancyTitle>{request.vacancy_title}</VacancyTitle>
            </RequestHeader>
            
            <CompanyInfo>🏢 {request.company_name}</CompanyInfo>
            <PartnerInfo>👤 {request.partner_name}</PartnerInfo>
            <RequestDate>
              📅 Запрошено: {new Date(request.created_at).toLocaleDateString('ru-RU')}
            </RequestDate>
            
            <ButtonGroup>
              <DownloadButton onClick={() => handleDownload(request.vacancy_id)}>
                📥 Скачать Excel
              </DownloadButton>
              <SentButton onClick={() => handleMarkSent(request.vacancy_id)}>
                ✅ Отправлено на почту
              </SentButton>
            </ButtonGroup>
          </RequestCard>
        ))
      )}
    </Container>
  );
};

export default ExportRequests;