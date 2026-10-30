'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Bell, Send, AlertCircle, CheckCircle, Clock, RotateCcw } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadNotifications();
  }, [statusFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications', {
        params: { status: statusFilter || undefined },
      });
      setNotifications(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bildirishnomalari</h1>
          <p className="text-sm text-gray-500">
            Avtomatik yuborilgan darsga kelmaganlik, to‘lov eslatmalari va cheklar monitoringi
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Barcha holatlar</option>
          <option value="SENT">Yetkazilgan (SENT)</option>
          <option value="FAILED">Xatolik (FAILED)</option>
          <option value="PENDING">Kutilmoqda (PENDING)</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Xabarnomalar topilmadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Turi</th>
                  <th className="px-6 py-3.5">Qabul qiluvchi</th>
                  <th className="px-6 py-3.5">Xabar matni</th>
                  <th className="px-6 py-3.5">Holat</th>
                  <th className="px-6 py-3.5">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800">
                        {n.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 block">{n.recipientType}</span>
                      <span className="text-xs text-blue-600 font-mono">TG: {n.recipientTelegramId}</span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-xs text-gray-700 line-clamp-2 whitespace-pre-line font-sans">
                        {n.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          n.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : n.status === 'FAILED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {n.status === 'SENT'
                          ? 'Yetkazildi'
                          : n.status === 'FAILED'
                            ? 'Xatolik'
                            : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(n.sentAt || n.createdAt).toLocaleString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
