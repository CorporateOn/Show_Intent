"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const LoginContent: React.FC = () => {
    const { login, authStatus } = useAppContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [role, setRole] = useState<'admin' | 'waiter'>('waiter');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Determine role from URL (e.g., ?role=admin)
    useEffect(() => {
        const roleFromQuery = searchParams?.get('role');
        if (roleFromQuery === 'admin' || roleFromQuery === 'waiter') {
            setRole(roleFromQuery);
        }
    }, [searchParams]);

    // If already authenticated, redirect to the correct dashboard
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
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    {role === 'admin' ? 'Admin Login' : 'Waiter Login'}
                </h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-primary text-white py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginContent;