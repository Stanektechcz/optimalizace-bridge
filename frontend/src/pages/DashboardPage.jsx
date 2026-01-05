/**
 * Dashboard Page - Overview and statistics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Calculator,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import filesService from '../services/filesService.js';
import calculationsService from '../services/calculationsService.js';
import configurationsService from '../services/configurationsService.js';
import { getStatusColor, getStatusLabel, formatDateTime } from '../utils/helpers';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    filesCount: 0,
    calculationsCount: 0,
    configurationsCount: 0,
    runningCalculations: 0,
    completedCalculations: 0,
    failedCalculations: 0,
    recentCalculations: [],
  });

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const startTime = performance.now();
      setLoading(true);
      
      // Use lightweight mode for faster loading - load all calculations once
      const startFetch = performance.now();
      const [filesData, allCalculations, configurationsData] = await Promise.all([
        filesService.getFiles(),
        calculationsService.getCalculations({ lightweight: true }), // One call with lightweight
        configurationsService.getConfigurations(),
      ]);
      const fetchTime = performance.now() - startFetch;
      console.log(`Dashboard data fetch took ${fetchTime.toFixed(0)}ms`);

      // Calculate status counts from the same data
      const allCalcs = allCalculations.calculations || [];
      const running = allCalcs.filter(c => c.status === 'running' || c.status === 'pending').length;
      const completed = allCalcs.filter(c => c.status === 'completed').length;
      const failed = allCalcs.filter(c => c.status === 'failed' || c.status === 'cancelled').length;

      setStats({
        filesCount: filesData.files?.length || 0,
        calculationsCount: allCalcs.length,
        configurationsCount: configurationsData.configurations?.length || 0,
        runningCalculations: running,
        completedCalculations: completed,
        failedCalculations: failed,
        recentCalculations: allCalcs.slice(0, 5), // Take first 5 for recent
      });
      
      const totalTime = performance.now() - startTime;
      console.log(`Dashboard total load took ${totalTime.toFixed(0)}ms`);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání dashboard..." />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Celkem kalkulací',
      value: stats.calculationsCount,
      icon: Calculator,
      color: 'bg-blue-500',
      href: '/calculations',
    },
    {
      title: 'Běžící',
      value: stats.runningCalculations,
      icon: Clock,
      color: 'bg-orange-500',
      href: '/calculations',
      badge: stats.runningCalculations > 0 ? 'active' : null,
    },
    {
      title: 'Dokončené',
      value: stats.completedCalculations,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/calculations',
    },
    {
      title: 'Selhané',
      value: stats.failedCalculations,
      icon: XCircle,
      color: 'bg-red-500',
      href: '/calculations',
    },
  ];

  const resourceCards = [
    {
      title: 'Soubory',
      value: stats.filesCount,
      icon: FileText,
      color: 'bg-indigo-500',
      href: '/files',
      description: 'Nahrané CSV soubory',
    },
    {
      title: 'Konfigurace',
      value: stats.configurationsCount,
      icon: Settings,
      color: 'bg-purple-500',
      href: '/configurations',
      description: 'Uložené konfigurace',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Vítejte zpět, {user?.full_name || user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">Přehled vašich kalkulací a projektů</p>
      </div>

      {/* Calculation Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiky kalkulací</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(card.href)}
                className="relative bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition"
              >
                {card.badge && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} rounded-lg p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {resourceCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.href)}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className={`${card.color} rounded-lg p-3 flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Calculations */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Poslední kalkulace</h2>
          <button
            onClick={() => navigate('/calculations')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Zobrazit vše
          </button>
        </div>

        {stats.recentCalculations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Zatím žádné kalkulace</h3>
            <p className="text-gray-600 mb-4">Vytvořte svou první kalkulaci</p>
            <button
              onClick={() => navigate('/calculations/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <Calculator className="w-5 h-5" />
              <span>Nová kalkulace</span>
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {stats.recentCalculations.map((calc) => (
              <div
                key={calc.id}
                onClick={() => navigate(`/calculations/${calc.id}`)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{calc.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDateTime(calc.created_at)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        calc.status
                      )}`}
                    >
                      {getStatusLabel(calc.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Nová kalkulace</h3>
          <p className="text-primary-100 mb-4">
            Vytvořte novou kalkulaci energetické bilance
          </p>
          <button
            onClick={() => navigate('/calculations/new')}
            className="px-4 py-2 bg-white text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition"
          >
            Začít kalkulaci
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Nastavení konfigurace</h3>
          <p className="text-purple-100 mb-4">Spravujte své výchozí konfigurace</p>
          <button
            onClick={() => navigate('/configurations')}
            className="px-4 py-2 bg-white text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition"
          >
            Otevřít konfigurace
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
