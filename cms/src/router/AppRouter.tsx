import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from '../api/client';
import { Navbar } from '../components/Navbar';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ShowsListPage } from '../pages/ShowsListPage';
import { ShowDetailPage } from '../pages/ShowDetailPage';
import { EpisodeEditorPage } from '../pages/EpisodeEditorPage';
import { ValidationReportPage } from '../pages/ValidationReportPage';
import { PublishPage } from '../pages/PublishPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/shows"
        element={
          <ProtectedLayout>
            <ShowsListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/shows/:id"
        element={
          <ProtectedLayout>
            <ShowDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/episodes/:id"
        element={
          <ProtectedLayout>
            <EpisodeEditorPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/validation"
        element={
          <ProtectedLayout>
            <ValidationReportPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/publish"
        element={
          <ProtectedLayout>
            <PublishPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
