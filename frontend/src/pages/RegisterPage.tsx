import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { Loader2, UserPlus, Mail, Lock, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to create account. Email may already be in use.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full neu-card p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl neu-inset text-primary-600 mb-3">
              <UserPlus className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
              Create Account
            </h2>
            <p className="mt-1.5 text-xs text-gray-500 font-medium">
              Start auditing and auto-remediating websites with AI
            </p>
          </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neu-inset block w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium text-[#1e1b4b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="neu-inset block w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium text-[#1e1b4b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="Re-enter password"
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
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-primary-700 hover:text-primary-800 underline decoration-primary-300 underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
