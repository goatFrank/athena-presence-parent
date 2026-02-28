import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
            } else {
                // If login is successful, Supabase automatically saves the session to localStorage
                console.log('Login successful');
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError('An unexpected error occurred during login.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="w-full max-w-5xl relative z-10 m-auto">
            <div className="fixed top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
            <div className="fixed bottom-10 right-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="bg-white rounded-[32px] shadow-deep border border-slate-100 flex flex-col md:flex-row overflow-hidden min-h-[600px] relative z-20 mx-4 lg:mx-0 mt-8 mb-8">
                {/* Left Side (Illustration) */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 relative flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                    <div className="relative z-10 w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
                        <div className="relative w-64 h-64">
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-28 bg-orange-200 rounded-[2rem] shadow-lg z-20">
                                <div className="absolute top-10 left-4 w-4 h-4 bg-slate-800 rounded-full"></div>
                                <div className="absolute top-10 right-4 w-4 h-4 bg-slate-800 rounded-full"></div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-6 h-3 bg-red-300 rounded-full opacity-50"></div>
                                <div className="absolute -top-4 -left-2 w-28 h-16 bg-slate-800 rounded-t-full rounded-bl-3xl"></div>
                            </div>
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-slate-200 rounded-xl shadow-xl z-30 flex items-center justify-center border-b-8 border-slate-300">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="material-icons text-blue-500 text-sm">shield</span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-24 bg-blue-500 rounded-t-[3rem] z-10"></div>
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-12 animate-bounce flex-shrink-0" style={{ animationDuration: '3s' }}>
                                <span className="material-icons text-yellow-500">work</span>
                            </div>
                            <div className="absolute bottom-20 -left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center -rotate-12 animate-bounce flex-shrink-0" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                                <span className="material-icons text-green-500">check_circle</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center relative z-10">
                        <h2 className="text-2xl font-brand font-semibold text-slate-800 mb-2">Workspace Freedom</h2>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Seamlessly track your location and connect with your team, wherever you are.</p>
                    </div>
                </div>

                {/* Right Side (Form) */}
                <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
                                <div className="relative w-6 h-6">
                                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[20px]">shield</span>
                                    <span className="material-symbols-outlined absolute -top-1 left-0 w-full flex justify-center text-[12px]">visibility</span>
                                </div>
                            </div>
                            <span className="text-2xl font-brand font-bold text-slate-800 tracking-tight">Athena</span>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back!</h1>
                        <p className="text-slate-500 mb-8 text-sm">Please enter your details to sign in.</p>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                                <span className="material-icons text-red-500 text-lg">error_outline</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">mail_outline</span>
                                    </div>
                                    <input
                                        className="block w-full pl-11 pr-4 py-3.5 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="email"
                                        name="email"
                                        placeholder="name@athena.com"
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors">lock_outline</span>
                                    </div>
                                    <input
                                        className="block w-full pl-11 pr-12 py-3.5 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 input-transition bg-slate-50 text-sm font-medium"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors focus:outline-none"
                                    >
                                        <span className="material-icons text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center">
                                    <input className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" id="remember-me" name="remember-me" type="checkbox" disabled={loading} />
                                    <label className="ml-2 block text-sm text-slate-600" htmlFor="remember-me">Remember me</label>
                                </div>
                                <a className="text-sm font-semibold text-primary hover:text-blue-700 transition-colors" href="#">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white transition-all duration-200 transform ${loading
                                    ? 'bg-blue-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5 shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-icons animate-spin mr-2 text-sm">autorenew</span>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wide">
                                <span className="px-4 bg-white text-slate-400 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <button className="w-full flex justify-center items-center py-3.5 px-4 border border-slate-200 rounded-2xl bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-all duration-200 group" type="button" disabled={loading}>
                            <img alt="SSO" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVS2CBsKogNkmvrqwDY2CZRQXv65uWoaE8lQLi_YS6pWgPFzM574z3jUDhwwUbKa3ukke8pNgXzHdiLMwkotakFO4yolmn-AQMN5DK2huCB089LGBQIzVRuuEV9Cjzo6hTCxJnEmGUSg40Vu3baWxttEVMU2aFa09iBafuu_ABNtcHM5T2GkP-VhSF1uc80BIT-ntDox-L6_knFBgPPMRvg-dT9jzA85pACYM6Co8x69ITTHBVSKUuGTxBLbWd6OX7nntKtMFlgu0" />
                            Single Sign-On (SSO)
                        </button>

                        <p className="mt-8 text-center text-xs text-slate-400">
                            Don't have an account? <a className="text-primary font-semibold hover:underline" href="#">Contact HR</a>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center pb-8">
                <div className="flex justify-center space-x-6 text-xs text-slate-400 font-medium">
                    <a className="hover:text-slate-600 transition-colors" href="#">Privacy</a>
                    <span className="text-slate-300">•</span>
                    <a className="hover:text-slate-600 transition-colors" href="#">Terms</a>
                    <span className="text-slate-300">•</span>
                    <a className="hover:text-slate-600 transition-colors" href="#">Help</a>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 opacity-60">
                    © 2024 Athena Inc. Internal System.
                </p>
            </div>
        </main>
    );
};

export default Login;
