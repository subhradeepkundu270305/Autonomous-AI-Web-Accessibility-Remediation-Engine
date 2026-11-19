import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { scansApi } from '../api/scans';
import {
  Globe,
  Search,
  Zap,
  Sparkles,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  Eye,
} from 'lucide-react';

const DEMO_URLS = [
  { label: '🏛️ CivicFix Portal', url: 'https://civicfix-one.vercel.app/', project: 'CivicFix Infrastructure' },
  { label: '📖 Wikipedia Main', url: 'https://en.wikipedia.org/wiki/Main_Page', project: 'Wikipedia Knowledge' },
  { label: '🛒 Example Store', url: 'https://example.com', project: 'Example Storefront' },
];

export function HomePage() {
  const [url, setUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let formattedUrl = url.trim();
    if (!formattedUrl) {
      setError('Please enter a website URL');
      return;
    }
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError('Please enter a valid website address (e.g. https://example.com)');
      return;
    }

    setLoading(true);
    try {
      const res = await scansApi.create(formattedUrl, projectName.trim() || undefined);
      navigate(`/scan/${res.data.data.scanId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start scan. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoUrl: string, demoProject: string) => {
    setUrl(demoUrl);
    setProjectName(demoProject);
    setError('');
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full text-center space-y-8">
          
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-card text-xs font-bold text-primary-800 border border-purple-200/60 animate-float-slow">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-accent-500 fill-accent-400" />
            <span>Autonomous Web Accessibility Remediation Engine</span>
            <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-[10px] ml-1">
              WCAG 2.1 AA
            </span>
          </div>

          {/* Hero Headlines */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-[#1e1b4b] tracking-tight leading-[1.15]">
              Scan Any Website for{' '}
              <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                Accessibility Issues
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Detect accessibility barriers in seconds, view side-by-side remediations on your live page, and export drop-in patches with multimodal AI.
            </p>
          </div>

          {/* Neumorphic Search & Input Box */}
          <div className="neu-card p-6 sm:p-8 max-w-2xl mx-auto border border-white/90">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                
                {/* Target URL Input */}
                <div className="neu-inset rounded-2xl flex items-center px-4 py-1 transition-all focus-within:ring-2 focus-within:ring-primary-500/50">
                  <Globe className="w-5 h-5 text-primary-500 shrink-0 mr-3" />
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter website URL (e.g. civicfix-one.vercel.app)"
                    className="w-full py-3.5 bg-transparent text-[#1e1b4b] placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none"
                    disabled={loading}
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Project Name (Optional) */}
                <div className="neu-inset rounded-2xl flex items-center px-4 py-0.5 transition-all focus-within:ring-2 focus-within:ring-primary-500/50">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project Name (Optional, e.g. Public Infrastructure Portal)"
                    className="w-full py-2.5 bg-transparent text-[#1e1b4b] placeholder-slate-400 text-xs sm:text-sm focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="neu-card p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                  {error}
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full neu-btn-primary py-4 px-6 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 group disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-accent-300" />
                    <span>Launching Headless Audit Engine...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 text-accent-300 group-hover:scale-110 transition-transform" />
                    <span>Audit Website & Generate AI Fixes</span>
                    <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Quick Demo Links */}
              <div className="pt-3 border-t border-purple-100/60 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent-500 fill-accent-400" />
                  Quick Test:
                </span>
                {DEMO_URLS.map((demo) => (
                  <button
                    key={demo.url}
                    type="button"
                    onClick={() => handleSelectDemo(demo.url, demo.project)}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-primary-700 hover:border-primary-300 transition-all"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* 3 Neumorphic Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
            
            {/* Card 1: Axe Core */}
            <div className="neu-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 text-primary-600 shadow-neu-sm group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1e1b4b] mb-1.5 flex items-center gap-1.5">
                  <span>axe-core Detection</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">90+ Rules</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep automated audit evaluating color contrast, button discernibility, ARIA landmarks, image text alternatives, and keyboard navigation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center gap-1 text-[11px] font-bold text-primary-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-500" />
                <span>Deterministic WCAG 2.1 AA</span>
              </div>
            </div>

            {/* Card 2: Gemini AI */}
            <div className="neu-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4 text-accent-600 shadow-neu-sm group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-accent-500" />
                </div>
                <h3 className="text-base font-bold text-[#1e1b4b] mb-1.5 flex items-center gap-1.5">
                  <span>Gemini Multimodal AI</span>
                  <span className="text-[10px] bg-amber-100 text-accent-800 px-1.5 py-0.5 rounded font-bold">Vision</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Understands visual layout context and image contents to synthesize genuine alt text, high-contrast color pairs, and accessible labels.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center gap-1 text-[11px] font-bold text-primary-600">
                <Zap className="w-3.5 h-3.5 text-accent-500 fill-accent-400" />
                <span>Context-Aware Semantic Repairs</span>
              </div>
            </div>

            {/* Card 3: Live Preview & Patch */}
            <div className="neu-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600 shadow-neu-sm group-hover:scale-105 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1e1b4b] mb-1.5 flex items-center gap-1.5">
                  <span>1-Click Live Preview</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Side-by-Side</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compare Original vs. Remediated side-by-side with interactive element highlights, and export a drop-in patch.js script with zero rebuild.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center gap-1 text-[11px] font-bold text-primary-600">
                <Code2 className="w-3.5 h-3.5 text-primary-500" />
                <span>Zero-Rebuild Instant Patch</span>
              </div>
            </div>

          </div>

          {/* Bottom Trust Badge */}
          <div className="neu-card-sm p-4 flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              100% Client-Side Safe Preview
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-500" />
              Automated PDF Audit Reports
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              WCAG 2.1 A & AA Full Conformance
            </span>
          </div>

        </div>
      </div>
    </Layout>
  );
}
