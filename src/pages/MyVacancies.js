import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #000000;
`;

const CreateButton = styled.button`
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056CC;
  }
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
  background-color: ${props => {
    switch (props.status) {
      case 'active': return '#34C759';
      case 'moderation': return '#007AFF';
      case 'draft': return '#C7C7CC';
      case 'archived': return '#8E8E93';
      default: return '#007AFF';
    }
  }};
  color: ${props => props.status === 'draft' ? '#333' : 'white'};
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
  flex-wrap: wrap;
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

const ArchiveButton = styled(Button)`
  background-color: #FF3B30;
  color: white;

  &:hover {
    background-color: #CC0000;
  }
`;

const ViewButton = styled(Button)`
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

const MyVacancies = () => {
  const { user } = useContext(AuthContext);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const response = await axios.get('/vacancies/partner/my');
      setVacancies(response.data.vacancies.filter(v => v.status !== 'archived'));
    } catch (error) {
      console.error('Error loading vacancies:', error);
    }
    setLoading(false);
  };

  const handleEdit = (vacancyId) => {
    navigate(`/vacancies/edit/${vacancyId}`);
  };

  const handleViewApplications = (vacancyId) => {
    navigate(`/vacancies/${vacancyId}/applications`);
  };

  const handleRequestExport = async (vacancyId) => {
    try {
      await axios.post(`/export-requests`, { vacancy_id: vacancyId });
      alert('Запрос на выгрузку отправлен куратору');
      loadVacancies();
    } catch (error) {
      console.error('Error requesting export:', error);
      alert('Ошибка при отправке запроса');
    }
  };

  const handleArchive = async (vacancyId) => {
    if (window.confirm('Вы уверены, что хотите архивировать вакансию?')) {
      try {
        await axios.put(`/vacancies/${vacancyId}/status`, { status: 'archived' });
        loadVacancies();
      } catch (error) {
        console.error('Error archiving vacancy:', error);
        alert('Ошибка при архивировании');
      }
    }
  };

  const getExportButtonText = (vacancy) => {
    if (vacancy.export_requested) {
      return vacancy.export_sent ? 'Информация на почте' : 'Запрос направлен';
    }
    return 'Запросить выгрузку';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Мои вакансии</Title>
        <CreateButton onClick={() => navigate('/vacancies/create')}>
          Создать
        </CreateButton>
      </Header>
      
      {vacancies.length === 0 ? (
        <EmptyState>
          <EmptyIcon>💼</EmptyIcon>
          <h3>Нет вакансий</h3>
          <p>Создайте вашу первую вакансию</p>
        </EmptyState>
      ) : (
        vacancies.map(vacancy => (
          <VacancyCard key={vacancy.id}>
            <VacancyHeader>
              <VacancyTitle>{vacancy.title}</VacancyTitle>
              <StatusBadge status={vacancy.status}>
                {vacancy.status === 'active' && 'Активна'}
                {vacancy.status === 'moderation' && 'На модерации'}
                {vacancy.status === 'draft' && 'Черновик'}
              </StatusBadge>
            </VacancyHeader>
            
            <VacancyInfo>📅 До {new Date(vacancy.deadline_date).toLocaleDateString('ru-RU')}</VacancyInfo>
            <ApplicationsCount>
              👥 Заявок: {vacancy.application_count || 0}/{vacancy.slots_count}
            </ApplicationsCount>
            
            <ButtonGroup>
              <ViewButton onClick={() => handleViewApplications(vacancy.id)}>
                👁 Отклики ({vacancy.application_count || 0})
              </ViewButton>
              <PrimaryButton onClick={() => handleEdit(vacancy.id)}>
                Редактировать
              </PrimaryButton>
            </ButtonGroup>
            <ButtonGroup style={{ marginTop: '8px' }}>
              <SecondaryButton 
                onClick={() => handleRequestExport(vacancy.id)}
                disabled={vacancy.export_requested}
              >
                {getExportButtonText(vacancy)}
              </SecondaryButton>
              <ArchiveButton onClick={() => handleArchive(vacancy.id)}>
                В архив
              </ArchiveButton>
            </ButtonGroup>
          </VacancyCard>
        ))
      )}
    </Container>
  );
};

export default MyVacancies;