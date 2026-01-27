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

const Form = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
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
  min-height: 80px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const LogoUpload = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoPreview = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: contain;
  background-color: #F2F2F7;
  border: 1px solid #E5E5EA;
`;

const DefaultLogo = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background-color: #F2F2F7;
  border: 1px solid #E5E5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
`;

const UploadButton = styled.button`
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
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

const InviteSection = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const InviteLink = styled.div`
  background-color: #F2F2F7;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #8E8E93;
  margin: 12px 0;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background-color: #34C759;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const MembersSection = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const MemberItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F2F2F7;

  &:last-child {
    border-bottom: none;
  }
`;

const MemberName = styled.div`
  font-size: 16px;
  color: #000000;
`;

const MemberRole = styled.div`
  font-size: 12px;
  color: #8E8E93;
`;

const Company = () => {
  const { user } = useContext(AuthContext);
  const [company, setCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const [companyResponse, membersResponse, inviteResponse] = await Promise.all([
        axios.get('/companies/my'),
        axios.get('/companies/members'),
        axios.post('/companies/invite')
      ]);
      
      setCompany(companyResponse.data.company);
      setFormData({
        name: companyResponse.data.company.name,
        description: companyResponse.data.company.description || ''
      });
      setMembers(membersResponse.data.members);
      setInviteLink(inviteResponse.data.invite_link);
    } catch (error) {
      console.error('Error loading company:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await axios.put('/companies/my', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCompany(response.data.company);
      setEditing(false);
      alert('Информация сохранена!');
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Ошибка при сохранении');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompany({...company, logo_url: e.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Ссылка скопирована!');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
  }

  const roleNames = {
    'partner': 'Партнер',
    'curator': 'Куратор',
    'admin': 'Администратор'
  };

  return (
    <Container>
      <Title>Компания</Title>
      
      <Form>
        <FormGroup>
          <Label>Логотип компании</Label>
          <LogoUpload>
            {company?.logo_url ? (
              <LogoPreview src={company.logo_url} alt={company.name} />
            ) : (
              <DefaultLogo>🏢</DefaultLogo>
            )}
            {editing && (
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
                id="logo-upload"
              />
            )}
            {editing && (
              <UploadButton onClick={() => document.getElementById('logo-upload').click()}>
                Загрузить
              </UploadButton>
            )}
          </LogoUpload>
        </FormGroup>
        
        <FormGroup>
          <Label>Название компании</Label>
          {editing ? (
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          ) : (
            <div style={{ padding: '12px 0', fontSize: '16px' }}>{company?.name}</div>
          )}
        </FormGroup>
        
        <FormGroup>
          <Label>Описание</Label>
          {editing ? (
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          ) : (
            <div style={{ padding: '12px 0', fontSize: '16px' }}>
              {company?.description || 'Нет описания'}
            </div>
          )}
        </FormGroup>
        
        {editing ? (
          <ButtonGroup>
            <SecondaryButton onClick={() => setEditing(false)}>
              Отмена
            </SecondaryButton>
            <PrimaryButton onClick={handleSave}>
              Сохранить
            </PrimaryButton>
          </ButtonGroup>
        ) : (
          <PrimaryButton onClick={() => setEditing(true)}>
            Редактировать
          </PrimaryButton>
        )}
      </Form>
      
      <InviteSection>
        <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Пригласить сотрудника</h3>
        <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '12px' }}>
          Отправьте эту ссылку сотруднику для присоединения к компании
        </p>
        <InviteLink>{inviteLink}</InviteLink>
        <CopyButton onClick={handleCopyInvite}>Копировать ссылку</CopyButton>
      </InviteSection>
      
      <MembersSection>
        <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Сотрудники ({members.length})</h3>
        {members.map(member => (
          <MemberItem key={member.id}>
            <div>
              <MemberName>{member.full_name || 'Без имени'}</MemberName>
              <MemberRole>{roleNames[member.role] || member.role}</MemberRole>
            </div>
          </MemberItem>
        ))}
      </MembersSection>
    </Container>
  );
};

export default Company;