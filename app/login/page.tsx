'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const LoginPage: React.FC = () => {
    const { login, authStatus } = useAppContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [role, setRole] = useState<'admin' | 'waiter'>('waiter');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // This determines if the admin login option should be visible
    const isAdminLogin = searchParams.get('role') === 'admin';

    useEffect(() => {
        const roleFromQuery = searchParams.get('role');
        if (roleFromQuery === 'admin' || roleFromQuery === 'waiter') {
            setRole(roleFromQuery);
        }
    }, [searchParams]);

    useEffect(() => {
        if (authStatus.isAuthenticated) {
            const destination = authStatus.role === 'admin' ? '/admin' : '/waiter';
            router.push(destination);
        }
    }, [authStatus, router]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setError('');
        setIsLoading(true);

        try {
            const success = await login(role, password);
            if (!success) {
                setError('Incorrect password. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-slate-100">
            <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
                
                {/* --- THIS IS THE NEW CONDITIONAL RENDERING --- */}
                {/* The toggle only shows if the admin explicitly navigates here */}
                {isAdminLogin && (
                    <div className="flex justify-center mb-6">
                        <button 
                            onClick={() => setRole('waiter')}
                            disabled={isLoading}
                            className={`px-6 py-2 w-1/2 text-center font-semibold rounded-l-lg transition-colors ${role === 'waiter' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Waiter
                        </button>
                        <button 
                            onClick={() => setRole('admin')}
                            disabled={isLoading}
                            className={`px-6 py-2 w-1/2 text-center font-semibold rounded-r-lg transition-colors ${role === 'admin' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Admin
                        </button>
                    </div>
                )}

                <h1 className="text-2xl font-bold mb-6 text-center text-brand-dark capitalize">{role} Login</h1>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={isLoading || !password}
                        className="w-full bg-brand-primary text-white font-bold py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;