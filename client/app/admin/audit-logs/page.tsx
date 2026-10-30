'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { ShieldAlert, Search, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await apiClient.get('/audit-logs');
      setLogs(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Jurnali</h1>
        <p className="text-sm text-gray-500">
          Kim, qachon, qaysi to‘lovni kiritgani yoki darsni bekor qilganini ko‘rsatuvchi xavfsizlik arxivi
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Audit yozuvlari mavjud emas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Harakat</th>
                  <th className="px-6 py-3.5">Ob'ekt (Entity)</th>
                  <th className="px-6 py-3.5">Bajaruvchi</th>
                  <th className="px-6 py-3.5">Tafsilotlar</th>
                  <th className="px-6 py-3.5">Vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {log.entity} <span className="text-xs text-gray-400 font-mono">({log.entityId?.substring(0, 8)})</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-800">
                      {log.actor?.name || log.actorId}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-500 font-mono">
                      {typeof log.diff === 'object' ? JSON.stringify(log.diff) : String(log.diff || '—')}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString('uz-UZ')}
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
