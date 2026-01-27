import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
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

const Form = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 16px;
  background-color: #F2F2F7;
  resize: vertical;
  min-height: 100px;
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

const MultiSelect = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const MultiSelectOption = styled.button`
  padding: 8px 16px;
  border: 1px solid ${props => props.selected ? '#007AFF' : '#E5E5EA'};
  border-radius: 20px;
  font-size: 14px;
  background-color: ${props => props.selected ? '#007AFF' : '#F2F2F7'};
  color: ${props => props.selected ? 'white' : '#333'};
  cursor: pointer;
  transition: all 0.2s;
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ColorOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid ${props => props.selected ? '#007AFF' : 'transparent'};
  background-color: ${props => props.color};
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
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

const CreateVacancy = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [majors, setMajors] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    position: '',
    description: '',
    major_ids: [],
    slots_count: '1',
    deadline_date: '',
    reward: '',
    header_bg_color: '#007AFF'
  });
  const [saving, setSaving] = useState(false);

  const headerColors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
    '#AF52DE', '#FF2D92', '#5856D6', '#00C7BE'
  ];

  useEffect(() => {
    loadMajors();
    if (isEdit) {
      loadVacancy();
    }
  }, [id]);

  const loadMajors = async () => {
    try {
      const response = await axios.get('/auth/majors');
      setMajors(response.data.majors);
    } catch (error) {
      console.error('Error loading majors:', error);
    }
  };

  const loadVacancy = async () => {
    try {
      const response = await axios.get(`/vacancies/${id}`);
      const vacancy = response.data.vacancy;
      setFormData({
        title: vacancy.title,
        position: vacancy.position,
        description: vacancy.description,
        major_ids: vacancy.major_ids || [],
        slots_count: vacancy.slots_count.toString(),
        deadline_date: vacancy.deadline_date,
        reward: vacancy.reward,
        header_bg_color: vacancy.header_bg_color || '#007AFF'
      });
    } catch (error) {
      console.error('Error loading vacancy:', error);
      alert('Ошибка при загрузке вакансии');
    }
  };

  const handleMajorToggle = (majorId) => {
    setFormData(prev => ({
      ...prev,
      major_ids: prev.major_ids.includes(majorId)
        ? prev.major_ids.filter(id => id !== majorId)
        : [...prev.major_ids, majorId]
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.deadline_date) {
      alert('Заполните все обязательные поля');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`/vacancies/${id}`, formData);
        alert('Вакансия обновлена!');
      } else {
        await axios.post('/vacancies', formData);
        alert('Вакансия создана и отправлена на модерацию!');
      }
      navigate('/vacancies');
    } catch (error) {
      console.error('Error saving vacancy:', error);
      alert('Ошибка при сохранении вакансии');
    }
    setSaving(false);
  };

  return (
    <Container>
      <Title>{isEdit ? 'Редактировать вакансию' : 'Создать вакансию'}</Title>
      
      <Form>
        <FormGroup>
          <Label>Название вакансии *</Label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Например: Стажер-разработчик"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Должность</Label>
          <Input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
            placeholder="Например: Junior Frontend Developer"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Описание задач *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Опишите задачи и требования..."
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Направление подготовки</Label>
          <MultiSelect>
            {majors.map(major => (
              <MultiSelectOption
                key={major.id}
                selected={formData.major_ids.includes(major.id)}
                onClick={() => handleMajorToggle(major.id)}
              >
                {major.name}
              </MultiSelectOption>
            ))}
          </MultiSelect>
        </FormGroup>
        
        <FormGroup>
          <Label>Количество мест *</Label>
          <Input
            type="number"
            min="1"
            value={formData.slots_count}
            onChange={(e) => setFormData({...formData, slots_count: e.target.value})}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Срок подачи заявок *</Label>
          <Input
            type="date"
            value={formData.deadline_date}
            onChange={(e) => setFormData({...formData, deadline_date: e.target.value})}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Вознаграждение</Label>
          <Input
            type="text"
            value={formData.reward}
            onChange={(e) => setFormData({...formData, reward: e.target.value})}
            placeholder="Например: 30 000 руб. или опыт"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Цвет фона вакансии</Label>
          <ColorPicker>
            {headerColors.map(color => (
              <ColorOption
                key={color}
                color={color}
                selected={formData.header_bg_color === color}
                onClick={() => setFormData({...formData, header_bg_color: color})}
              />
            ))}
          </ColorPicker>
        </FormGroup>
        
        <ButtonGroup>
          <SecondaryButton onClick={() => navigate('/vacancies')}>
            Отмена
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
          </PrimaryButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
};

export default CreateVacancy;