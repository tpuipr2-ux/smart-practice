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

const VacancyCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const VacancyHeader = styled.div`
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
  background-color: #8E8E93;
  color: white;
`;

const VacancyInfo = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const ApplicationsCount = styled.div`
  font-size: 14px;
  color: #007AFF;
  font-weight: 500;
  margin-bottom: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const PrimaryButton = styled(Button)`
  background-color: #007AFF;
  color: white;

  &:hover {
    background-color: #0056CC;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #E5E5EA;
  color: #007AFF;

  &:hover {
    background-color: #D1D1D6;
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

const Archive = () => {
  const { user } = useContext(AuthContext);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const response = await axios.get('/vacancies/partner/my?status=archived');
      setVacancies(response.data.vacancies);
    } catch (error) {
      console.error('Error loading archived vacancies:', error);
    }
    setLoading(false);
  };

  const handleDuplicate = async (vacancyId) => {
    try {
      const response = await axios.post(`/vacancies/${vacancyId}/duplicate`);
      navigate(`/vacancies/edit/${response.data.vacancy.id}`);
    } catch (error) {
      console.error('Error duplicating vacancy:', error);
      alert('Ошибка при копировании вакансии');
    }
  };

  const handleRestore = async (vacancyId) => {
    try {
      await axios.put(`/vacancies/${vacancyId}/status`, { status: 'draft' });
      loadVacancies();
      alert('Вакансия восстановлена');
    } catch (error) {
      console.error('Error restoring vacancy:', error);
      alert('Ошибка при восстановлении вакансии');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Title>Архив вакансий</Title>
      
      {vacancies.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📁</EmptyIcon>
          <h3>Архив пуст</h3>
          <p>Завершенные вакансии будут отображаться здесь</p>
        </EmptyState>
      ) : (
        vacancies.map(vacancy => (
          <VacancyCard key={vacancy.id}>
            <VacancyHeader>
              <VacancyTitle>{vacancy.title}</VacancyTitle>
              <StatusBadge>Архив</StatusBadge>
            </VacancyHeader>
            
            <VacancyInfo>📅 Завершена: {new Date(vacancy.deadline_date).toLocaleDateString('ru-RU')}</VacancyInfo>
            <ApplicationsCount>
              👥 Получено заявок: {vacancy.application_count || 0}
            </ApplicationsCount>
            
            <ButtonGroup>
              <PrimaryButton onClick={() => handleDuplicate(vacancy.id)}>
                Создать на основе
              </PrimaryButton>
              <SecondaryButton onClick={() => handleRestore(vacancy.id)}>
                Восстановить
              </SecondaryButton>
            </ButtonGroup>
          </VacancyCard>
        ))
      )}
    </Container>
  );
};

export default Archive;