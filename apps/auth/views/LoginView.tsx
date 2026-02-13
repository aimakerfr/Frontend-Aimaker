/**
 * Login View - Login form
 * Uses auth from CORE only
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by auth store
      console.error('Login failed:', err);
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
            
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Login</h2>
            <p className="text-gray-600">Welcome back! Please sign in to your account</p>
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
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/auth/register" 
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 items-center justify-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-white rounded-full animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-white rounded-full animate-blob animation-delay-4000"></div>
          </div>

          {/* Main Illustration */}
          <div className="relative z-10 text-center text-white">
            <div className="mb-8 relative">
              {/* Animated AI Brain/Network Illustration */}
              <svg className="w-full h-80" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Circuit board pattern */}
                <g className="animate-pulse-slow opacity-50">
                  <line x1="50" y1="100" x2="150" y2="100" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="250" y1="100" x2="350" y2="100" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="100" y1="50" x2="100" y2="150" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="300" y1="50" x2="300" y2="150" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                </g>

                {/* Central AI Node */}
                <circle cx="200" cy="200" r="60" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="3" className="animate-pulse" />
                <circle cx="200" cy="200" r="40" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
                
                {/* AI Brain Symbol */}
                <path d="M200 170 Q180 175, 180 190 T200 210 Q220 205, 220 190 T200 170" fill="white" className="animate-pulse-slow" />
                <circle cx="190" cy="190" r="3" fill="white" className="animate-ping-slow" />
                <circle cx="210" cy="190" r="3" fill="white" className="animate-ping-slow animation-delay-1000" />

                {/* Orbiting nodes */}
                <g className="animate-spin-slow origin-center" style={{transformOrigin: "200px 200px"}}>
                  <circle cx="200" cy="120" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                  <circle cx="280" cy="200" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                  <circle cx="200" cy="280" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                  <circle cx="120" cy="200" r="15" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="2" />
                </g>

                {/* Connection lines */}
                <g className="opacity-60">
                  <line x1="200" y1="140" x2="200" y2="120" stroke="white" strokeWidth="2" />
                  <line x1="240" y1="200" x2="280" y2="200" stroke="white" strokeWidth="2" />
                  <line x1="200" y1="260" x2="200" y2="280" stroke="white" strokeWidth="2" />
                  <line x1="160" y1="200" x2="120" y2="200" stroke="white" strokeWidth="2" />
                </g>

                {/* Data particles */}
                <circle cx="150" cy="150" r="3" fill="white" className="animate-bounce-slow" />
                <circle cx="250" cy="150" r="3" fill="white" className="animate-bounce-slow animation-delay-2000" />
                <circle cx="250" cy="250" r="3" fill="white" className="animate-bounce-slow animation-delay-3000" />
                <circle cx="150" cy="250" r="3" fill="white" className="animate-bounce-slow animation-delay-1000" />

                {/* Outer circuit elements */}
                <rect x="50" y="50" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse" />
                <rect x="330" y="50" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse animation-delay-1000" />
                <rect x="330" y="330" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse animation-delay-2000" />
                <rect x="50" y="330" width="20" height="20" fill="rgba(255,255,255,0.2)" rx="4" className="animate-pulse animation-delay-3000" />
              </svg>
            </div>

            <h3 className="text-4xl font-bold mb-4">
              Create Amazing Things with AI
            </h3>
            <p className="text-lg text-purple-100">
              Access powerful AI tools and automation to bring your ideas to life
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
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        .animate-ping-slow {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
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
