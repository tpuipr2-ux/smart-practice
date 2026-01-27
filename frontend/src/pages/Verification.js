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

const SkillCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SkillHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const SkillName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0;
  flex: 1;
`;

const StudentInfo = styled.div`
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #8E8E93;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const Verification = () => {
  const { user } = useContext(AuthContext);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await axios.get('/skills/pending/verification');
      setSkills(response.data.skills);
    } catch (error) {
      console.error('Error loading skills for verification:', error);
    }
    setLoading(false);
  };

  const handleVerify = async (skillId, isVerified) => {
    try {
      await axios.put(`/skills/${skillId}/verify`, { is_verified: isVerified });
      setSkills(skills.filter(s => s.id !== skillId));
    } catch (error) {
      console.error('Error verifying skill:', error);
      alert('Ошибка при верификации');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  return (
    <Container>
      <Title>Верификация навыков</Title>
      
      {skills.length === 0 ? (
        <EmptyState>
          <EmptyIcon>✅</EmptyIcon>
          <h3>Нет запросов на верификацию</h3>
          <p>Все навыки проверены</p>
        </EmptyState>
      ) : (
        skills.map(skill => (
          <SkillCard key={skill.id}>
            <SkillHeader>
              <SkillName>{skill.skill_name}</SkillName>
            </SkillHeader>
            
            <StudentInfo>
              👤 Студент: {skill.full_name}
            </StudentInfo>
            
            <ButtonGroup>
              <ApproveButton onClick={() => handleVerify(skill.id, true)}>
                Подтвердить
              </ApproveButton>
              <RejectButton onClick={() => handleVerify(skill.id, false)}>
                Отклонить
              </RejectButton>
            </ButtonGroup>
          </SkillCard>
        ))
      )}
    </Container>
  );
};

export default Verification;