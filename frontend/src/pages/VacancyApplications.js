import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #000000;
  margin: 0;
`;

const StatsCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #007AFF;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-top: 4px;
`;

const ApplicationCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ApplicationNumber = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #F2F2F7;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: #8E8E93;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #000000;
  font-weight: 500;
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

const ExportButton = styled.button`
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  margin-top: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056CC;
  }

  &:disabled {
    background-color: #C7C7CC;
    cursor: not-allowed;
  }
`;

const VacancyApplications = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [vacancyTitle, setVacancyTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [id]);

  const loadApplications = async () => {
    try {
      const response = await axios.get(`/vacancies/${id}/applications`);
      setApplications(response.data.applications);
      setVacancyTitle(response.data.vacancy_title);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
    setLoading(false);
  };

  const handleExportRequest = async () => {
    setExporting(true);
    try {
      await axios.post(`/vacancies/${id}/export-request`);
      alert('Запрос на выгрузку отправлен куратору');
    } catch (error) {
      console.error('Error requesting export:', error);
      if (error.response?.status === 400) {
        alert('Запрос на выгрузку уже отправлен');
      } else {
        alert('Ошибка при отправке запроса');
      }
    }
    setExporting(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(-1)}>←</BackButton>
        <Title>Отклики: {vacancyTitle}</Title>
      </Header>

      <StatsCard>
        <StatItem>
          <StatValue>{applications.length}</StatValue>
          <StatLabel>Всего откликов</StatLabel>
        </StatItem>
      </StatsCard>

      {applications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>👤</EmptyIcon>
          <h3>Пока нет откликов</h3>
          <p>Студенты еще не откликнулись на эту вакансию</p>
        </EmptyState>
      ) : (
        <>
          {applications.map((app, index) => (
            <ApplicationCard key={app.id}>
              <ApplicationNumber>Отклик #{index + 1}</ApplicationNumber>
              
              <InfoRow>
                <InfoLabel>Курс обучения</InfoLabel>
                <InfoValue>{app.course || 'Не указан'}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>Направление</InfoLabel>
                <InfoValue>{app.major_name || 'Не указано'}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>Подтвержденных навыков</InfoLabel>
                <InfoValue>{app.verified_skills_count}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <InfoLabel>Дата отклика</InfoLabel>
                <InfoValue>{new Date(app.applied_at).toLocaleDateString('ru-RU')}</InfoValue>
              </InfoRow>
            </ApplicationCard>
          ))}

          <ExportButton onClick={handleExportRequest} disabled={exporting}>
            {exporting ? 'Отправка запроса...' : '📥 Запросить выгрузку данных'}
          </ExportButton>
        </>
      )}
    </Container>
  );
};

export default VacancyApplications;