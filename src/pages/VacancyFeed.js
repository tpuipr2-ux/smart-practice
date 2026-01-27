import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const FeedContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 16px;
  background-color: #F2F2F7;
  margin-bottom: 16px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%238E8E93" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>');
  background-repeat: no-repeat;
  background-position: 16px center;
  padding-left: 48px;
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

const Reward = styled.div`
  font-size: 16px;
  color: #34C759;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Deadline = styled.div`
  font-size: 14px;
  color: #FF9500;
  margin-bottom: 12px;
`;

const ApplicationsCount = styled.div`
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

const PrimaryButton = styled(Button)`
  background-color: #007AFF;
  color: white;

  &:hover {
    background-color: #0056CC;
  }

  &:disabled {
    background-color: #C7C7CC;
    cursor: not-allowed;
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

const VacancyFeed = () => {
  const { user } = useContext(AuthContext);
  const [vacancies, setVacancies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const response = await axios.get('/vacancies');
      setVacancies(response.data.vacancies);
    } catch (error) {
      console.error('Error loading vacancies:', error);
    }
    setLoading(false);
  };

  const handleApply = async (vacancyId) => {
    try {
      await axios.post(`/vacancies/${vacancyId}/apply`);
      loadVacancies(); // Reload to update status
    } catch (error) {
      console.error('Error applying to vacancy:', error);
      alert('Ошибка при подаче заявки');
    }
  };

  const handleHide = (vacancyId) => {
    setVacancies(vacancies.filter(v => v.id !== vacancyId));
  };

  const filteredVacancies = vacancies.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.position.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <FeedContainer>
      <SearchInput
        type="text"
        placeholder="Поиск вакансий..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      {filteredVacancies.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <h3>Нет вакансий</h3>
          <p>Попробуйте изменить критерии поиска</p>
        </EmptyState>
      ) : (
        filteredVacancies.map(vacancy => (
          <VacancyCard key={vacancy.id} onClick={() => navigate(`/vacancies/${vacancy.id}`)}>
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
              {vacancy.reward && <Reward>{vacancy.reward}</Reward>}
              <Deadline>📅 До {new Date(vacancy.deadline_date).toLocaleDateString('ru-RU')}</Deadline>
              <ApplicationsCount>
                👥 Заявки: {vacancy.application_count || 0}/{vacancy.slots_count}
              </ApplicationsCount>
              
              {user.role === 'student' && (
                <ButtonGroup>
                  {vacancy.user_applied ? (
                    <PrimaryButton disabled>✅ Вы откликнулись</PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={(e) => {
                      e.stopPropagation();
                      handleApply(vacancy.id);
                    }}>
                      Откликнуться
                    </PrimaryButton>
                  )}
                  <SecondaryButton onClick={(e) => {
                    e.stopPropagation();
                    handleHide(vacancy.id);
                  }}>
                    Скрыть
                  </SecondaryButton>
                </ButtonGroup>
              )}
            </VacancyContent>
          </VacancyCard>
        ))
      )}
    </FeedContainer>
  );
};

export default VacancyFeed;