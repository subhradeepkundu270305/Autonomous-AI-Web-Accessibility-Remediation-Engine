import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Sparkles, KeyRound, Mail, Lock } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to sign in. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@example.com');
    setPassword('Demo#A11yEngine2026!');
    setError('');
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full neu-card p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl neu-inset text-primary-600 mb-3">
              <KeyRound className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
              Sign in to Engine
            </h2>
            <p className="mt-1.5 text-xs text-gray-500 font-medium">
              Autonomous Accessibility Remediation & Auditing Platform
            </p>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="neu-card-sm p-4 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50/60 to-purple-50/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Demo Credentials Available
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="neu-btn-accent text-[11px] font-extrabold py-1 px-3 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Auto-fill
              </button>
            </div>
            <div className="text-[11px] text-gray-700 font-mono space-y-0.5 bg-white/70 p-2.5 rounded-lg border border-white">
              <div>
                <span className="text-gray-400">User: </span>
                <span className="font-bold text-[#1e1b4b]">demo@example.com</span>
              </div>
              <div>
                <span className="text-gray-400">Pass: </span>
                <span className="font-bold text-[#1e1b4b]">Demo#A11yEngine2026!</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="neu-inset p-3 rounded-xl border border-rose-300 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email-address"
                className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neu-inset block w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium text-[#1e1b4b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neu-inset block w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium text-[#1e1b4b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="neu-btn-primary w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-600">
              Need a new account?{' '}
              <Link
                to="/register"
                className="font-bold text-primary-700 hover:text-primary-800 underline decoration-primary-300 underline-offset-2 transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
