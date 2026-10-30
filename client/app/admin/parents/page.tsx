'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Search, HeartHandshake, Phone, Send, GraduationCap, UserPlus } from 'lucide-react';

export default function ParentsPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadParents();
  }, [search]);

  const loadParents = async () => {
    try {
      const res = await apiClient.get('/parents', {
        params: { search: search || undefined },
      });
      setParents(res.data.items || res.data);
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
          <h1 className="text-2xl font-bold text-gray-900">Ota-onalar</h1>
          <p className="text-sm text-gray-500">
            Farzandlar uchun mas'ul ota-onalar bazasi va Telegram xabarnomalar qabul qiluvchilar
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ism yoki telefon bo‘yicha qidiruv..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : parents.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Ota-onalar topilmadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Ota-ona (F.I.SH)</th>
                  <th className="px-6 py-3.5">Telefon</th>
                  <th className="px-6 py-3.5">Biriktirilgan Farzandlari</th>
                  <th className="px-6 py-3.5">Telegram Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parents.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{p.phone}</td>
                    <td className="px-6 py-4">
                      {p.children && p.children.length > 0 ? (
                        <div className="space-y-1">
                          {p.children.map((c: any) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 mr-1.5 font-medium"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Farzand biriktirilmagan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.telegramId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">
                          <Send className="w-3 h-3" /> {p.telegramId}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Ulanmagan</span>
                      )}
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
