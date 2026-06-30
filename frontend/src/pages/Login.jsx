import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function Login() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isToggled, setIsToggled] = useState(false); // false = Login, true = Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isToggled) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error("Full name is required.");
        }
        await signup(email, password, name);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center p-4">
      {/* Inject custom CSS styles for the shapes, premium buttons, and transitions */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

        .login-container {
          font-family: 'Poppins', sans-serif;
          background-color: #1a1a2e;
          position: relative;
          overflow: hidden;
          width: 100vw;
          height: 100vh;
        }

        /* Glowing background circles for visual depth */
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, rgba(26, 26, 46, 0) 70%);
          filter: blur(80px);
          pointer-events: none;
        }
        .glow-1 {
          top: -10%;
          left: -10%;
          width: 500px;
          height: 500px;
        }
        .glow-2 {
          bottom: -10%;
          right: -10%;
          width: 500px;
          height: 500px;
        }

        .card-wrapper {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 500px;
          background-color: #1a1a2e;
          border: 2px solid #00d4ff;
          box-shadow: 0 0 25px #00d4ff;
          border-radius: 15px;
          overflow: hidden;
          z-index: 10;
        }

        /* Shape 1: Diagonal Gradient (Right side by default) */
        .shape-1 {
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(45deg, #1a1a2e, #00d4ff);
          transform: skewX(-10deg) translateX(8%);
          transform-origin: bottom right;
          transition: transform 1.5s ease, width 1.5s ease;
          z-index: 2;
        }
        .toggled .shape-1 {
          transform: skewX(10deg) translateX(-108%);
        }

        /* Shape 2: Dark split shape (Left side by default) */
        .shape-2 {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background-color: #111124;
          border-right: 2px solid #00d4ff;
          transform: skewX(-10deg) translateX(-8%);
          transform-origin: top left;
          transition: transform 1.5s ease;
          z-index: 1;
        }
        .toggled .shape-2 {
          transform: skewX(10deg) translateX(108%);
        }

        /* Panel columns */
        .panel-half {
          position: absolute;
          top: 0;
          height: 100%;
          width: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 45px;
          z-index: 10;
        }
        .panel-left {
          left: 0;
        }
        .panel-right {
          right: 0;
        }

        /* Login Form positioning */
        .login-form-el {
          transform: translateX(0);
          opacity: 1;
          transition: transform 1.5s ease, opacity 1.5s ease;
          transition-delay: 0.2s;
        }
        .toggled .login-form-el {
          transform: translateX(-130%);
          opacity: 0;
          pointer-events: none;
          transition-delay: 0s;
        }

        /* Welcome Left Text positioning */
        .welcome-left-el {
          transform: translateX(-130%);
          opacity: 0;
          pointer-events: none;
          transition: transform 1.5s ease, opacity 1.5s ease;
          transition-delay: 0s;
        }
        .toggled .welcome-left-el {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
          transition-delay: 0.2s;
        }

        /* Welcome Right Text positioning */
        .welcome-right-el {
          transform: translateX(0);
          opacity: 1;
          transition: transform 1.5s ease, opacity 1.5s ease;
          transition-delay: 0.2s;
        }
        .toggled .welcome-right-el {
          transform: translateX(130%);
          opacity: 0;
          pointer-events: none;
          transition-delay: 0s;
        }

        /* Register Form positioning */
        .signup-form-el {
          transform: translateX(130%);
          opacity: 0;
          pointer-events: none;
          transition: transform 1.5s ease, opacity 1.5s ease;
          transition-delay: 0s;
        }
        .toggled .signup-form-el {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
          transition-delay: 0.2s;
        }

        /* Premium hover button styling */
        .btn-premium {
          position: relative;
          width: 100%;
          height: 45px;
          border: 2px solid #00d4ff;
          border-radius: 40px;
          background: transparent;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.4s ease, border-color 0.4s ease;
        }
        .btn-premium::before {
          content: "";
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #1a1a2e, #00d4ff);
          z-index: -1;
          transition: top 0.4s ease;
        }
        .btn-premium:hover {
          color: #ffffff;
          border-color: #00d4ff;
        }
        .btn-premium:hover::before {
          top: 0;
        }
        .btn-premium:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Google button styling */
        .btn-google {
          width: 100%;
          height: 45px;
          background: transparent;
          border: 2px solid #ffffff;
          border-radius: 40px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
          transition: 0.3s;
        }
        .btn-google:hover {
          border-color: #00d4ff;
          color: #00d4ff;
        }
        .btn-google:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Form input styling */
        .input-wrapper {
          position: relative;
          margin-bottom: 16px;
          text-align: left;
        }
        .input-icon {
          position: absolute;
          inset-y: 0;
          left: 0;
          padding-left: 16px;
          display: flex;
          align-items: center;
          pointer-events: none;
          color: #9CA3AF;
        }
        .input-premium {
          width: 100%;
          background-color: rgba(18, 18, 36, 0.8);
          border: 1px solid rgba(156, 163, 175, 0.4);
          border-radius: 40px;
          padding-left: 44px;
          padding-right: 16px;
          padding-top: 10px;
          padding-bottom: 10px;
          font-size: 13px;
          color: white;
          outline: none;
          transition: all 0.3s ease;
        }
        .input-premium::placeholder {
          color: #6B7280;
        }
        .input-premium:focus {
          border-color: #00d4ff;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="glow-circle glow-1" />
      <div className="glow-circle glow-2" />

      {/* Main Premium Card Wrapper */}
      <div className={`card-wrapper ${isToggled ? "toggled" : ""}`}>
        
        {/* Animated Background Shapes */}
        <div className="shape-1" />
        <div className="shape-2" />

        {/* LEFT PANEL */}
        <div className="panel-half panel-left text-left">
          
          {/* LOGIN FORM (Shown by default, slides left on SignUp toggle) */}
          <div className="login-form-el w-full flex flex-col justify-center h-full">
            <h2 className="text-[32px] font-black text-white text-center mb-6">Login</h2>
            
            {error && !isToggled && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/45 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-1">
              {/* Username/Email Input */}
              <div className="input-wrapper">
                <div className="input-icon">
                  {/* fa-solid fa-user representation */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                />
              </div>

              {/* Password Input */}
              <div className="input-wrapper">
                <div className="input-icon">
                  {/* fa-solid fa-lock representation */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-premium mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Login"
                )}
              </button>
            </form>

            {/* Google Sign-In */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="btn-google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            {/* Toggle link to SignUp */}
            <p className="text-xs text-gray-400 mt-6 text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsToggled(true);
                  setError("");
                }}
                className="text-[#00d4ff] hover:underline font-semibold cursor-pointer bg-transparent border-none p-0 inline-block"
              >
                Sign Up
              </button>
            </p>
          </div>

          {/* WELCOME TEXT PANEL (Shown when toggled to SignUp) */}
          <div className="welcome-left-el w-full flex flex-col justify-center h-full text-left text-white space-y-3">
            <h2 className="text-[36px] font-black tracking-tight leading-tight uppercase">
              WELCOME!
            </h2>
            <p className="text-sm text-blue-100 font-medium">
              Join Traject to build your own verified MLE career roadmap.
            </p>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="panel-half panel-right text-right">
          
          {/* WELCOME BACK TEXT PANEL (Shown by default) */}
          <div className="welcome-right-el w-full flex flex-col justify-center h-full text-right text-white space-y-3">
            <h2 className="text-[36px] font-black tracking-tight leading-tight uppercase">
              WELCOME BACK!
            </h2>
            <p className="text-sm text-blue-100 font-medium">
              Log in to continue tracking your machine learning journey.
            </p>
          </div>

          {/* SIGNUP/REGISTER FORM (Shown when toggled to SignUp) */}
          <div className="signup-form-el w-full flex flex-col justify-center h-full">
            <h2 className="text-[32px] font-black text-white text-center mb-6">Register</h2>

            {error && isToggled && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/45 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200 text-left">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-1">
              {/* Full Name Input */}
              <div className="input-wrapper">
                <div className="input-icon">
                  {/* fa-solid fa-user representation */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                />
              </div>

              {/* Email Input */}
              <div className="input-wrapper">
                <div className="input-icon">
                  {/* fa-solid fa-envelope representation */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                />
              </div>

              {/* Password Input */}
              <div className="input-wrapper">
                <div className="input-icon">
                  {/* fa-solid fa-lock representation */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium"
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-premium mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Register"
                )}
              </button>
            </form>

            {/* Google Sign-In */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="btn-google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            {/* Toggle link to SignIn */}
            <p className="text-xs text-gray-400 mt-6 text-center">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsToggled(false);
                  setError("");
                }}
                className="text-[#00d4ff] hover:underline font-semibold cursor-pointer bg-transparent border-none p-0 inline-block"
              >
                Sign In
              </button>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
