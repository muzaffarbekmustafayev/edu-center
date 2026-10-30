'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  Calendar,
  CheckSquare,
  CreditCard,
  DollarSign,
  BarChart3,
  Bell,
  ShieldAlert,
  Settings,
  FolderKanban,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Xodimlar & O‘qituvchilar', href: '/admin/users', icon: Users },
  { name: 'O‘quvchilar', href: '/admin/students', icon: GraduationCap },
  { name: 'Ota-onalar', href: '/admin/parents', icon: HeartHandshake },
  { name: 'Kurslar', href: '/admin/courses', icon: BookOpen },
  { name: 'Guruhlar', href: '/admin/groups', icon: FolderKanban },
  { name: 'Darslar', href: '/admin/lessons', icon: Calendar },
  { name: 'Davomat', href: '/admin/attendance', icon: CheckSquare },
  { name: 'To‘lovlar (Prepay)', href: '/admin/payments', icon: CreditCard },
  { name: 'Buxgalteriya', href: '/admin/transactions', icon: DollarSign },
  { name: 'Hisobotlar', href: '/admin/reports', icon: BarChart3 },
  { name: 'Xabarnomalar', href: '/admin/notifications', icon: Bell },
  { name: 'Audit Log', href: '/admin/audit-logs', icon: ShieldAlert },
  { name: 'Sozlamalar', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          E
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">Edu Center</h1>
          <p className="text-xs text-blue-600 font-medium">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
