import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import AzureCallback from './pages/AzureCallback';
import Dashboard from './pages/Dashboard';
import ContractView from './pages/ContractView';
import authService from './services/authService';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<AzureCallback />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/contract/:uid"
            element={
              <PrivateRoute>
                <ContractView />
              </PrivateRoute>
            }
          />
          <Route
            path="/contract"
            element={
              <PrivateRoute>
                <ContractView />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

