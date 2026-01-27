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

const Section = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #000000;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F2F2F7;

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.div`
  font-size: 16px;
  color: #8E8E93;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #007AFF;
`;

const NavButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  background-color: #007AFF;
  color: white;
  margin-bottom: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056CC;
  }
`;

const AdminPanel = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  const getUserStats = (role) => {
    const stat = stats?.users?.find(u => u.role === role);
    return stat ? stat.count : 0;
  };

  const getVacancyStats = (status) => {
    const stat = stats?.vacancies?.find(v => v.status === status);
    return stat ? stat.count : 0;
  };

  return (
    <Container>
      <Title>Административная панель</Title>
      
      <Section>
        <SectionTitle>Статистика</SectionTitle>
        
        <StatItem>
          <StatLabel>Всего пользователей</StatLabel>
          <StatValue>{getUserStats('student') + getUserStats('partner') + getUserStats('curator') + getUserStats('admin')}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Студентов</StatLabel>
          <StatValue>{getUserStats('student')}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Партнеров</StatLabel>
          <StatValue>{getUserStats('partner')}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Всего вакансий</StatLabel>
          <StatValue>{getVacancyStats('active') + getVacancyStats('moderation') + getVacancyStats('draft') + getVacancyStats('archived')}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Активных вакансий</StatLabel>
          <StatValue>{getVacancyStats('active')}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Заявок на практику</StatLabel>
          <StatValue>{stats?.applications?.total || 0}</StatValue>
        </StatItem>
      </Section>
      
      <Section>
        <SectionTitle>Управление</SectionTitle>
        <NavButton onClick={() => window.location.href = '/admin/users'}>
          👥 Пользователи
        </NavButton>
        <NavButton onClick={() => window.location.href = '/admin/vacancies'}>
          💼 Все вакансии
        </NavButton>
        <NavButton onClick={() => window.location.href = '/admin/companies'}>
          🏢 Компании
        </NavButton>
        <NavButton onClick={() => window.location.href = '/admin/majors'}>
          📚 Направления подготовки
        </NavButton>
      </Section>
    </Container>
  );
};

export default AdminPanel;