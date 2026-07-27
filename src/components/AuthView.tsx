/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useHackMate } from "../context/HackMateContext";
import { motion } from "motion/react";
import { Mail, Lock, User, Sparkles, Flame, GraduationCap, Github, ArrowRight } from "lucide-react";

interface AuthViewProps {
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const { loginUser, signupUser, verifyResetEmail, resetPassword } = useHackMate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [role, setRole] = useState("Frontend");
  const [exp, setExp] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>("Intermediate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    try {
      if (forgotStep === 1) {
        const res = await verifyResetEmail(email);
        if (res.success) {
          setForgotStep(2);
        } else {
          setError(res.error || "Email verification failed.");
        }
      } else {
        if (!verificationAnswer || !newPassword || !confirmPassword) {
          setError("Please fill in all verification and password fields.");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        const res = await resetPassword(email, verificationAnswer, newPassword);
        if (res.success) {
          setSuccessMessage("Your password has been reset successfully! You can now sign in with your new password.");
        } else {
          setError(res.error || "Failed to reset password.");
        }
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setForgotStep(1);
    setVerificationAnswer("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all core credentials.");
      return;
    }

    if (!isLogin && (!fullName || !college)) {
      setError("Full Name and College are required for profile generation.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser(email, password);
        if (res.success) {
          onAuthSuccess();
        } else {
          setError(res.error || "Login failed.");
        }
      } else {
        const res = await signupUser({
          email,
          password,
          fullName,
          college,
          experienceLevel: exp,
          preferredRoles: [role],
          bio: ""
        });
        if (res.success) {
          onAuthSuccess();
        } else {
          setError(res.error || "Signup failed.");
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setError("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await loginUser("arnavsao123@gmail.com", undefined, undefined, true);
      if (res.success) {
        onAuthSuccess();
      } else {
        setError(res.error || "Google sign-in failed.");
      }
    } catch (err) {
      setError("Failed to continue with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_container" className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#09090B]">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#6C63FF]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C63FF] to-purple-600 shadow-[0_0_20px_rgba(108,99,255,0.3)] mb-4">
            <Flame className="h-7 w-7 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
            {isForgotPassword ? "Reset Password" : (isLogin ? "Welcome Back" : "Create Your Profile")}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isForgotPassword
              ? "Verify your account details to recover your password"
              : (isLogin
                ? "Sign in to connect with compatible sprint partners"
                : "Generate your skill tags and enter the team arena")}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          
          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  {error}
                </div>
              )}

              {successMessage ? (
                <div className="space-y-4 text-center py-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-relaxed">
                    {successMessage}
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer mt-4"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  {forgotStep === 1 ? (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        Enter your account email below. We will check if it exists in the arena records before initiating identity verification.
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                          <input
                            id="forgot_email"
                            type="email"
                            placeholder="name@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <button
                        id="forgot_verify_email_btn"
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-6"
                      >
                        {loading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span>Verify Email</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl text-xs text-zinc-300 leading-relaxed mb-4">
                        <span className="font-semibold text-white block mb-1">Identity Verification Required</span>
                        To secure your account, please enter the name of the <strong>College / Institution</strong> exactly as registered on your profile.
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Registered College / Institution</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                          <input
                            id="forgot_college_verification"
                            type="text"
                            placeholder="e.g. DTU or IIT Bombay"
                            value={verificationAnswer}
                            onChange={(e) => setVerificationAnswer(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                          <input
                            id="forgot_new_password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                          <input
                            id="forgot_confirm_password"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <button
                        id="forgot_reset_password_btn"
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-6"
                      >
                        {loading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span>Update Password</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="text-center mt-6 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            <>
              {/* Google SSO button */}
              <button
                id="google_auth_btn"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.4 3.65 1.48 7.5l3.77 2.92c.9-2.7 3.4-4.38 6.75-4.38z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.14-1.97 3.38-4.88 3.38-8.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.58c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.48 7.14C.54 9.01 0 11.11 0 13.32s.54 4.31 1.48 6.18l3.77-2.92z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.67-2.84c-1.01.68-2.31 1.08-3.95 1.08-3.35 0-5.85-1.68-6.75-4.38L1.8 16.86C3.72 20.7 7.67 23 12 23z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-6 flex items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-xs text-zinc-500 uppercase font-mono tracking-wider">or email</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                    {error}
                  </div>
                )}

                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <input
                          id="signup_fullname"
                          type="text"
                          placeholder="e.g. Arnav Sao"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">College / Institution</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <input
                          id="signup_college"
                          type="text"
                          placeholder="e.g. DTU or IIT Bombay"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preferred Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-[#09090B] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                        >
                          <option value="Frontend">Frontend</option>
                          <option value="Backend">Backend</option>
                          <option value="AI/ML">AI/ML</option>
                          <option value="UI UX">UI UX</option>
                          <option value="Flutter">Flutter</option>
                          <option value="Cloud">Cloud</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Exp Level</label>
                        <select
                          value={exp}
                          onChange={(e) => setExp(e.target.value as any)}
                          className="w-full bg-[#09090B] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-all cursor-pointer"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      id="auth_email"
                      type="email"
                      placeholder="name@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-400">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotStep(1);
                          setError("");
                        }}
                        className="text-[10px] text-[#C0B9FF] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      id="auth_password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  id="auth_submit_btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-6"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>{isLogin ? "Sign In" : "Initialize Arena"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  id="toggle_auth_mode_btn"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isLogin ? "Need a teammate account? Sign Up" : "Already have an account? Log In"}
                </button>
              </div>
            </>
          )}

        </div>

        {/* Fun Security & Features info */}
        <div className="grid grid-cols-2 gap-4 mt-8 text-center text-xs text-zinc-500">
          <div className="glass p-3 rounded-xl">
            <Sparkles className="h-4 w-4 mx-auto text-[#6C63FF] mb-1" />
            <h4 className="font-semibold text-zinc-300">Intelligent Matching</h4>
            <p className="text-[10px] mt-0.5">Dual-layer AI fit calculation</p>
          </div>
          <div className="glass p-3 rounded-xl">
            <Github className="h-4 w-4 mx-auto text-purple-400 mb-1" />
            <h4 className="font-semibold text-zinc-300">Repository Analysis</h4>
            <p className="text-[10px] mt-0.5">Automated skill verification</p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
