/**
 * Register View - Registration form
 * Uses auth from CORE only
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';

export function RegisterView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by auth store
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  AImaker
                </h1>
                <p className="text-sm text-gray-500">FabLab Platform</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-gray-600">Join us and start creating with AI today</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-shake">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  minLength={2}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center group"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/auth/login" 
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 p-12 items-center justify-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-white rounded-full animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-white rounded-full animate-blob animation-delay-4000"></div>
          </div>

          {/* Main Illustration - Innovation/Collaboration Theme */}
          <div className="relative z-10 text-center text-white">
            <div className="mb-8 relative">
              <svg className="w-full h-80" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Lightbulb - Innovation symbol */}
                <g className="animate-pulse-slow">
                  <ellipse cx="200" cy="240" rx="45" ry="15" fill="rgba(255,255,255,0.2)" />
                  <path d="M 200 140 Q 160 160, 160 200 Q 160 230, 180 250 L 180 260 L 220 260 L 220 250 Q 240 230, 240 200 Q 240 160, 200 140 Z" 
                        fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="3" />
                  <rect x="185" y="260" width="30" height="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" rx="3" />
                  
                  {/* Light rays */}
                  <line x1="200" y1="110" x2="200" y2="85" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-ping-slow" />
                  <line x1="150" y1="130" x2="135" y2="115" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-ping-slow animation-delay-1000" />
                  <line x1="250" y1="130" x2="265" y2="115" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-ping-slow animation-delay-2000" />
                  <line x1="130" y1="170" x2="105" y2="165" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-ping-slow animation-delay-500" />
                  <line x1="270" y1="170" x2="295" y2="165" stroke="white" strokeWidth="3" strokeLinecap="round" className="animate-ping-slow animation-delay-1500" />
                </g>

                {/* Collaboration nodes - people connecting */}
                <g className="animate-bounce-slow">
                  <circle cx="100" cy="320" r="20" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                  <circle cx="100" cy="310" r="8" fill="white" />
                  
                  <circle cx="200" cy="340" r="20" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                  <circle cx="200" cy="330" r="8" fill="white" />
                  
                  <circle cx="300" cy="320" r="20" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                  <circle cx="300" cy="310" r="8" fill="white" />
                </g>

                {/* Connection lines */}
                <g className="opacity-60">
                  <line x1="120" y1="320" x2="180" y2="340" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="220" y1="340" x2="280" y2="320" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="200" y1="280" x2="200" y2="320" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                </g>

                {/* Floating elements - ideas */}
                <g>
                  <circle cx="80" cy="100" r="8" fill="rgba(255,255,255,0.4)" className="animate-float" />
                  <circle cx="130" cy="80" r="6" fill="rgba(255,255,255,0.4)" className="animate-float animation-delay-1000" />
                  <circle cx="270" cy="90" r="7" fill="rgba(255,255,255,0.4)" className="animate-float animation-delay-2000" />
                  <circle cx="320" cy="110" r="9" fill="rgba(255,255,255,0.4)" className="animate-float animation-delay-500" />
                </g>

                {/* Decorative gears */}
                <g className="animate-spin-slow" style={{transformOrigin: "80px 200px"}}>
                  <circle cx="80" cy="200" r="20" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
                  <circle cx="80" cy="200" r="12" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
                </g>
                
                <g className="animate-spin-reverse-slow" style={{transformOrigin: "320px 220px"}}>
                  <circle cx="320" cy="220" r="25" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
                  <circle cx="320" cy="220" r="15" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
                </g>
              </svg>
            </div>

            <h3 className="text-4xl font-bold mb-4">
              Transform Ideas into Reality
            </h3>
            <p className="text-lg text-blue-100">
              Join our community of makers and innovators using AI-powered tools
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin 15s linear infinite reverse;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        .animate-ping-slow {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
