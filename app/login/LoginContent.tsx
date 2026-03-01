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

    const isAdminLogin = searchParams?.get('role') === 'admin';

    useEffect(() => {
        const roleFromQuery = searchParams?.get('role');
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
            {/* Your entire JSX remains unchanged */}
        </div>
    );
};

export default LoginContent;