import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

const ApplicationCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ApplicationHeader = styled.div`
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

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return '#34C759';
      case 'completed': return '#8E8E93';
      default: return '#007AFF';
    }
  }};
  color: white;
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const CompanyLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
`;

const CompanyName = styled.span`
  font-size: 14px;
  color: #8E8E93;
`;

const ApplicationDate = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const Reward = styled.div`
  font-size: 16px;
  color: #34C759;
  font-weight: 600;
  margin-bottom: 12px;
`;

const Button = styled.button`
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056CC;
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

const MyApplications = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await axios.get('/users/applications');
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Title>Мои заявки</Title>
      
      {applications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📄</EmptyIcon>
          <h3>Нет заявок</h3>
          <p>Вы еще не подали заявки на вакансии</p>
        </EmptyState>
      ) : (
        applications.map(application => (
          <ApplicationCard key={application.id}>
            <ApplicationHeader>
              <VacancyTitle>{application.title}</VacancyTitle>
              <StatusBadge status={application.app_status}>
                {application.app_status === 'active' ? 'Активна' : 'Сбор завершен'}
              </StatusBadge>
            </ApplicationHeader>
            
            <CompanyInfo>
              {application.company_logo ? (
                <CompanyLogo src={application.company_logo} alt={application.company_name} />
              ) : (
                <span>🏢</span>
              )}
              <CompanyName>{application.company_name}</CompanyName>
            </CompanyInfo>
            
            <ApplicationDate>
              📅 Подано: {new Date(application.applied_at).toLocaleDateString('ru-RU')}
            </ApplicationDate>
            
            {application.reward && <Reward>{application.reward}</Reward>}
            
            <Button onClick={() => navigate(`/vacancies/${application.vacancy_id}`)}>
              Подробности
            </Button>
          </ApplicationCard>
        ))
      )}
    </Container>
  );
};

export default MyApplications;