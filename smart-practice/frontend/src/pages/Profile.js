import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const ProfileContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
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

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #8E8E93;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 16px;
  background-color: #F2F2F7;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 16px;
  background-color: #F2F2F7;
  cursor: pointer;
`;

const Button = styled.button`
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056CC;
  }

  &:disabled {
    background-color: #C7C7CC;
    cursor: not-allowed;
  }
`;

const SkillItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #F2F2F7;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const SkillName = styled.span`
  font-size: 16px;
  color: #000000;
`;

const SkillStatus = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  background-color: ${props => props.verified ? '#34C759' : '#FF9500'};
  color: white;
`;

const AddSkillForm = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const AddSkillInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 16px;
  background-color: #F2F2F7;
`;

const AddSkillButton = styled.button`
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 16px;
  cursor: pointer;
`;

const RoleBadge = styled.div`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  background-color: #007AFF;
  color: white;
  margin-bottom: 16px;
`;

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [majors, setMajors] = useState([]);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    major_id: user.major_id || '',
    course: user.course || ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState(user.skills || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMajors();
  }, []);

  const loadMajors = async () => {
    try {
      const response = await axios.get('/auth/majors');
      setMajors(response.data.majors);
    } catch (error) {
      console.error('Error loading majors:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await axios.post('/auth/profile', formData);
      updateUser(response.data.user);
      alert('Профиль сохранен!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Ошибка при сохранении профиля');
    }
    setSaving(false);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    try {
      const response = await axios.post('/skills', { skill_name: newSkill });
      setSkills([...skills, response.data.skill]);
      setNewSkill('');
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Ошибка при добавлении навыка');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await axios.delete(`/skills/${skillId}`);
      setSkills(skills.filter(s => s.id !== skillId));
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Ошибка при удалении навыка');
    }
  };

  const roleNames = {
    'student': 'Студент',
    'partner': 'Партнер',
    'curator': 'Куратор',
    'admin': 'Администратор'
  };

  return (
    <ProfileContainer>
      <Section>
        <SectionTitle>Профиль</SectionTitle>
        <RoleBadge>{roleNames[user.role] || user.role}</RoleBadge>
        
        <FormGroup>
          <Label>ФИО</Label>
          <Input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            placeholder="Введите ФИО"
          />
        </FormGroup>
        
        {(user.role === 'student') && (
          <>
            <FormGroup>
              <Label>Направление подготовки</Label>
              <Select
                value={formData.major_id}
                onChange={(e) => setFormData({...formData, major_id: e.target.value})}
              >
                <option value="">Выберите направление</option>
                {majors.map(major => (
                  <option key={major.id} value={major.id}>{major.name}</option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Курс</Label>
              <Input
                type="number"
                min="1"
                max="6"
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
                placeholder="Введите курс"
              />
            </FormGroup>
          </>
        )}
        
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </Section>
      
      {(user.role === 'student') && (
        <Section>
          <SectionTitle>Навыки и опыт</SectionTitle>
          
          {skills.map(skill => (
            <SkillItem key={skill.id}>
              <SkillName>{skill.skill_name}</SkillName>
              <SkillStatus verified={skill.is_verified}>
                {skill.is_verified ? '✅ Подтверждено' : '⌛ На проверке'}
              </SkillStatus>
              {!skill.is_verified && (
                <button 
                  onClick={() => handleDeleteSkill(skill.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FF3B30',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  🗑️
                </button>
              )}
            </SkillItem>
          ))}
          
          {skills.length === 0 && (
            <p style={{ color: '#8E8E93', textAlign: 'center', padding: '20px' }}>
              Нет добавленных навыков
            </p>
          )}
          
          <AddSkillForm>
            <AddSkillInput
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Название навыка"
            />
            <AddSkillButton onClick={handleAddSkill}>Добавить</AddSkillButton>
          </AddSkillForm>
        </Section>
      )}
      
      <Section>
        <SectionTitle>Контакты</SectionTitle>
        <p style={{ color: '#8E8E93', fontSize: '14px' }}>
          Telegram ID: {user.telegram_id}
        </p>
        <p style={{ color: '#8E8E93', fontSize: '14px' }}>
          Телефон: {user.phone}
        </p>
      </Section>
    </ProfileContainer>
  );
};

export default Profile;