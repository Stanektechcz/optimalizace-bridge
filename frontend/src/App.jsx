import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/common/Layout';

// Pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import CalculationsPage from './pages/CalculationsPage';
import NewCalculationPage from './pages/NewCalculationPage';
import CalculationDetailPage from './pages/CalculationDetailPage';
import ResultsPage from './pages/ResultsPage';
import ConfigurationsPage from './pages/ConfigurationsPage';
import ConfigurationFormPage from './pages/ConfigurationFormPage';
import UsersManagementPage from './pages/UsersManagementPage';
import ReportsPage from './pages/ReportsPage';

import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Layout>
                  <FilesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calculations"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalculationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calculations/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewCalculationPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calculations/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalculationDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calculations/:id/results"
            element={
              <ProtectedRoute>
                <Layout>
                  <ResultsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configurations"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConfigurationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configurations/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConfigurationFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configurations/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConfigurationFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <UsersManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Reports page */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Stránka nenalezena</p>
                  <a
                    href="/dashboard"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Zpět na dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
