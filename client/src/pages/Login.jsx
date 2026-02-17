import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-100 via-white to-accent-100 items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/assets/cvsu-banner.jpg"
              alt="Cavite State University College of Nursing"
              className="max-w-xs mix-blend-multiply"
            />
          </div>
          <div className="mb-8 flex justify-center">
            <img
              src="/assets/lucsuhin.png"
              alt="Lucsuhin Integrated School Logo"
              className="w-72 h-72 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            School Clinic<br />Management System
          </h1>
          <p className="text-xl text-gray-600">
            Nurse & Admin Access Portal
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white/90 backdrop-blur-sm">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/assets/lucsuhin.png"
                alt="Lucsuhin Integrated School Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              School Clinic Management System
            </h1>
            <p className="text-sm text-gray-600">
              Nurse & Admin Access Portal
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="nurse@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="inline-block bg-accent-200 text-accent-900 px-6 py-2 rounded-full text-sm font-medium border border-accent-300">
              Nurse Access Only
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
