import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/api';
import { Beef, Users, Cat, Activity, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const { t } = useTranslation();

  const stats = [
    {
      name: t('dashboard.totalAnimals'),
      value: '45',
      icon: <Cat size={24} />,
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      path: '/animals'
    },
    {
      name: t('dashboard.owners'),
      value: '12',
      icon: <Users size={24} />,
      colorClass: 'text-sky-700 bg-sky-50 border-sky-100',
      path: '/owners'
    },
    {
      name: t('dashboard.appointmentsToday'),
      value: '8',
      icon: <Activity size={24} />,
      colorClass: 'text-amber-700 bg-amber-50 border-amber-100',
      path: '/appointments'
    },
    {
      name: t('dashboard.alerts'),
      value: '2',
      icon: <Beef size={24} />,
      colorClass: 'text-red-700 bg-red-50 border-red-100',
      path: '/alerts'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 pb-2 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {t('dashboard.welcome', { username: user?.username || '' })}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Link
            key={idx}
            to={stat.path}
            className="card bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${stat.colorClass}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{stat.name}</p>
                <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-emerald-700 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="card bg-white rounded-2xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="text-gray-400 text-sm text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <Activity size={36} className="text-gray-300 mx-auto mb-2" />
          <p>{t('dashboard.noRecentActivity')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
