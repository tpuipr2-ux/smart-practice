import React, { useContext } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { AuthContext } from '../contexts/AuthContext';

const LayoutContainer = styled.div`
  min-height: 100vh;
  background-color: #F2F2F7;
`;

const Header = styled.div`
  background-color: #ffffff;
  padding: 12px 16px;
  border-bottom: 1px solid #E5E5EA;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h1`
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #007AFF;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
`;

const BottomNav = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top: 1px solid #E5E5EA;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  max-width: 600px;
  margin: 0 auto;
`;

const NavItem = styled.button`
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 12px;
  cursor: pointer;
  color: ${props => props.active ? '#007AFF' : '#8E8E93'};
  font-size: 10px;
  font-weight: ${props => props.active ? '500' : '400'};
  transition: all 0.2s;
`;

const NavIcon = styled.div`
  font-size: 24px;
  margin-bottom: 2px;
`;

const Layout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBack = () => {
    if (location.pathname === '/') {
      WebApp.close();
    } else {
      navigate(-1);
    }
  };
  
  const getNavItems = () => {
    const items = [];
    
    if (user.role === 'student' || user.role === 'curator' || user.role === 'admin') {
      items.push(
        { path: '/', label: 'Лента', icon: '📋' },
        { path: '/applications', label: 'Заявки', icon: '📄' }
      );
    }
    
    if (user.role === 'partner' || user.role === 'curator' || user.role === 'admin') {
      items.push(
        { path: '/vacancies', label: 'Вакансии', icon: '💼' },
        { path: '/company', label: 'Компания', icon: '🏢' }
      );
    }
    
    if (user.role === 'curator' || user.role === 'admin') {
      items.push(
        { path: '/moderation', label: 'Модерация', icon: '🔍' }
      );
    }
    
    if (user.role === 'admin') {
      items.push(
        { path: '/admin', label: 'Админ', icon: '⚙️' }
      );
    }
    
    items.push({ path: '/profile', label: 'Профиль', icon: '👤' });
    
    return items;
  };
  
  const navItems = getNavItems();
  
  return (
    <LayoutContainer>
      <Header>
        <BackButton onClick={handleBack}>←</BackButton>
        <HeaderTitle>Smart Practice</HeaderTitle>
        <div style={{ width: 32 }} />
      </Header>
      
      <Content>
        {children}
      </Content>
      
      <div style={{ height: 80 }} />
      
      <BottomNav>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <NavIcon>{item.icon}</NavIcon>
            {item.label}
          </NavItem>
        ))}
      </BottomNav>
    </LayoutContainer>
  );
};

export default Layout;