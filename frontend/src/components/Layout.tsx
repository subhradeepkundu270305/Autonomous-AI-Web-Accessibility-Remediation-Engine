import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ShieldCheck, LogOut, User, Zap, PlusCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f9] text-[#1e1b4b] selection:bg-purple-200 selection:text-purple-900">
      {/* Top Floating Neumorphic Header */}
      <header className="sticky top-3 z-40 px-3 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto neu-card px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Badges */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-neu-purple group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-accent-300 fill-accent-300 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-violet-800 via-purple-700 to-indigo-900 bg-clip-text text-transparent">
                  A11y Engine
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-100 text-accent-800 border border-accent-300 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-accent-600" />
                  AI v2.0
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
                Autonomous Web Accessibility Remediation
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/'
                  ? 'neu-inset text-primary-700'
                  : 'text-slate-600 hover:text-primary-700 hover:bg-purple-50/50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary-600" />
              New Audit
            </Link>
          </nav>

          {/* Right User State / CTA */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="neu-inset px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-700 max-w-[200px] truncate">
                  <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3 text-primary-600" />
                  </div>
                  <span className="truncate">{user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="neu-btn p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                  title="Sign out of account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="neu-btn px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-primary-700 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-accent-300" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Modern Neumorphic Footer */}
      <footer className="mt-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto neu-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-slate-700">
              Autonomous AI Web Accessibility Remediation Engine
            </span>
            <span className="text-slate-400">·</span>
            <span>WCAG 2.1 Level AA Standard</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="px-2.5 py-1 rounded-lg neu-inset text-[11px] font-medium text-slate-600">
              ⚡ Powered by Gemini 3.8
            </span>
            <span className="px-2.5 py-1 rounded-lg neu-inset text-[11px] font-medium text-slate-600">
              🛡️ axe-core Rules
            </span>
            <span className="px-2.5 py-1 rounded-lg neu-inset text-[11px] font-medium text-slate-600">
              🔧 Auto patch.js
            </span>
            <span className="text-slate-400 text-[11px] ml-2">
              © {new Date().getFullYear()} A11y Engine
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
