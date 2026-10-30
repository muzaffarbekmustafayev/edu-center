'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Lock, Phone, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('AdminPassword123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', {
        phone: phone.trim(),
        password,
      });

      const { accessToken, user } = res.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user_info', JSON.stringify(user));

      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/teacher/groups');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
          'Kirishda xatolik yuz berdi. Telefon va parolni tekshiring.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (p: string, pass: string) => {
    setPhone(p);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-200">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edu Center</h1>
          <p className="text-sm text-gray-500 mt-1">O‘quv Markaz Boshqaruv Tizimi</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Telefon raqam
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998901234567"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Tekshirilmoqda...</span>
            ) : (
              <>
                <span>Tizimga kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center font-medium mb-3">
            Tezkor test kirish (Standart ma'lumotlar):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('+998901234567', 'AdminPassword123!')}
              className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-800 text-left transition"
            >
              <span className="font-semibold block">👨‍💼 Administrator</span>
              <span className="text-[10px] text-gray-500">+998901234567</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('+998907654321', 'TeacherPassword123!')}
              className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-800 text-left transition"
            >
              <span className="font-semibold block">👨‍🏫 O‘qituvchi</span>
              <span className="text-[10px] text-gray-500">+998907654321</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
