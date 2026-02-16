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

const VacancyCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const VacancyHeader = styled.div`
  background-color: ${props => props.bgColor || '#007AFF'};
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
`;

const CompanyLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: white;
  padding: 4px;
  object-fit: contain;
`;

const DefaultLogo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const VacancyTitle = styled.h3`
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const VacancyContent = styled.div`
  padding: 16px;
`;

const CompanyName = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const Position = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 8px;
`;

const Description = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const VacancyInfo = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const PartnerInfo = styled.div`
  font-size: 14px;
  color: #007AFF;
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

const ApproveButton = styled(Button)`
  background-color: #34C759;
  color: white;

  &:hover {
    background-color: #28A745;
  }
`;

const RejectButton = styled(Button)`
  background-color: #FF3B30;
  color: white;

  &:hover {
    background-color: #CC0000;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #E5E5EA;
  color: #1C1C1E;

  &:hover {
    background-color: #D1D1D6;
  }
`;

const EditButton = styled(Button)`
  background-color: #007AFF;
  color: white;

  &:hover {
    background-color: #0056CC;
  }
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F2F2F7;
  resize: vertical;
  min-height: 60px;
  margin-top: 12px;
  margin-bottom: 12px;
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

const Moderation = () => {
  const { user } = useContext(AuthContext);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const response = await axios.get('/curator/vacancies/moderation');
      setVacancies(response.data.vacancies);
    } catch (error) {
      console.error('Error loading vacancies for moderation:', error);
    }
    setLoading(false);
  };

  const handleModerate = async (vacancyId, action, comment = '') => {
    try {
      await axios.put(`/curator/vacancies/${vacancyId}/moderate`, {
        action,
        comment
      });
      
      // Remove from list
      setVacancies(vacancies.filter(v => v.id !== vacancyId));
      setRejectingId(null);
      setRejectComment('');
    } catch (error) {
      console.error('Error moderating vacancy:', error);
      alert('Ошибка при модерации');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Title>Модерация вакансий</Title>
      
      {vacancies.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🔍</EmptyIcon>
          <h3>Нет вакансий на модерации</h3>
          <p>Все вакансии проверены</p>
        </EmptyState>
      ) : (
        vacancies.map(vacancy => (
          <VacancyCard key={vacancy.id}>
            <VacancyHeader bgColor={vacancy.header_bg_color}>
              {vacancy.company_logo ? (
                <CompanyLogo src={vacancy.company_logo} alt={vacancy.company_name} />
              ) : (
                <DefaultLogo>🏢</DefaultLogo>
              )}
              <VacancyTitle>{vacancy.title}</VacancyTitle>
            </VacancyHeader>
            
            <VacancyContent>
              <CompanyName>{vacancy.company_name}</CompanyName>
              <Position>{vacancy.position}</Position>
              <Description>{vacancy.description}</Description>
              <VacancyInfo>📅 До {new Date(vacancy.deadline_date).toLocaleDateString('ru-RU')}</VacancyInfo>
              <VacancyInfo>👥 Мест: {vacancy.slots_count}</VacancyInfo>
              {vacancy.reward && <VacancyInfo>💰 {vacancy.reward}</VacancyInfo>}
              <PartnerInfo>👤 {vacancy.partner_name}</PartnerInfo>
              
              {rejectingId === vacancy.id ? (
                <>
                  <CommentInput
                    placeholder="Причина отклонения..."
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                  />
                  <ButtonGroup>
                    <SecondaryButton onClick={() => setRejectingId(null)}>
                      Отмена
                    </SecondaryButton>
                    <RejectButton onClick={() => handleModerate(vacancy.id, 'reject', rejectComment)}>
                      Отклонить
                    </RejectButton>
                  </ButtonGroup>
                </>
              ) : (
                <ButtonGroup>
                  <ApproveButton onClick={() => handleModerate(vacancy.id, 'approve')}>
                    Одобрить
                  </ApproveButton>
                  <RejectButton onClick={() => setRejectingId(vacancy.id)}>
                    Отклонить
                  </RejectButton>
                  <EditButton onClick={() => alert('Редактирование в разработке')}>
                    Редактировать
                  </EditButton>
                </ButtonGroup>
              )}
            </VacancyContent>
          </VacancyCard>
        ))
      )}
    </Container>
  );
};

export default Moderation;
