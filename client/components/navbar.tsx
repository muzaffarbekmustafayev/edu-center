'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { PwaInstallPrompt } from './pwa-install-prompt';
import { LogOut, UserCircle } from 'lucide-react';

export function Navbar({ title }: { title?: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title || 'Boshqaruv Paneli'}</h2>
      </div>

      <div className="flex items-center gap-4">
        <PwaInstallPrompt />

        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="flex items-center gap-2">
            <UserCircle className="w-6 h-6 text-gray-400" />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {user?.name || 'Foydalanuvchi'}
              </p>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                {user?.role === 'ADMIN' ? 'Administrator' : 'O‘qituvchi'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
