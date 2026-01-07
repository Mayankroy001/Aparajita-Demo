
import React from 'react';
import { Shield } from 'lucide-react';
import { User } from '../types';

interface Props {
  user: User | null;
}

const Header: React.FC<Props> = ({ user }) => {
  const getInitials = () => {
    if (!user) return '??';
    const names = user.username.split(' ');
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
          <Shield size={20} fill="currentColor" />
        </div>
        <h1 className="text-xl font-bold text-indigo-900 tracking-tight">Aparajita</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 border border-slate-200">
          <span className="text-xs font-bold">{getInitials()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
