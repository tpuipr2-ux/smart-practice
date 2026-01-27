import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

// Contexts
import { AuthContext } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';
import Loading from './components/Loading';

// Pages
import Profile from './pages/Profile';
import VacancyFeed from './pages/VacancyFeed';
import MyApplications from './pages/MyApplications';
import MyVacancies from './pages/MyVacancies';
import CreateVacancy from './pages/CreateVacancy';
import VacancyApplications from './pages/VacancyApplications';
import Company from './pages/Company';
import Archive from './pages/Archive';
import Moderation from './pages/Moderation';
import Verification from './pages/Verification';
import ExportRequests from './pages/ExportRequests';
import AdminPanel from './pages/AdminPanel';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Telegram Web App
    WebApp.ready();
    WebApp.expand();

    // Get user data from Telegram
    const initData = WebApp.initDataUnsafe;
    
    if (initData && initData.user) {
      const telegramId = initData.user.id;
      
      // Set axios header for all requests
      axios.defaults.headers.common['X-Telegram-ID'] = telegramId;
      
      // Load user data
      loadUserData(telegramId);
    } else {
      // For development, try to get user without Telegram
      const telegramId = 123476570; // Admin ID for testing
      axios.defaults.headers.common['X-Telegram-ID'] = telegramId;
      loadUserData(telegramId);
    }
  }, []);

  const loadUserData = async (telegramId) => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error loading user:', error);
      
      // If user doesn't exist, try to create with basic info
      if (error.response?.status === 404) {
        try {
          const initData = WebApp.initDataUnsafe;
          const response = await axios.post('/auth/profile', {
            full_name: initData?.user?.first_name || 'Пользователь',
          });
          setUser(response.data.user);
        } catch (createError) {
          console.error('Error creating user:', createError);
        }
      }
    }
    setLoading(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return <Loading />;
  }

  // If no user, show registration flow
  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Пользователь не найден</h3>
          <p>Нажмите /start в боте для регистрации</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, updateUser }}>
      <Router>
        <Layout>
          <Routes>
            {/* Common routes */}
            <Route path="/profile" element={<Profile />} />
            
            {/* Student routes */}
            {(user.role === 'student' || user.role === 'curator' || user.role === 'admin') && (
              <>
                <Route path="/" element={<VacancyFeed />} />
                <Route path="/applications" element={<MyApplications />} />
              </>
            )}
            
            {/* Partner routes */}
            {(user.role === 'partner' || user.role === 'curator' || user.role === 'admin') && (
              <>
                <Route path="/company" element={<Company />} />
                <Route path="/vacancies" element={<MyVacancies />} />
                <Route path="/vacancies/create" element={<CreateVacancy />} />
                <Route path="/vacancies/edit/:id" element={<CreateVacancy />} />
                <Route path="/vacancies/:id/applications" element={<VacancyApplications />} />
                <Route path="/archive" element={<Archive />} />
              </>
            )}
            
            {/* Curator routes */}
            {user.role === 'curator' && (
              <>
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/export-requests" element={<ExportRequests />} />
              </>
            )}
            
            {/* Admin routes */}
            {user.role === 'admin' && (
              <>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/export-requests" element={<ExportRequests />} />
              </>
            )}
            
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;