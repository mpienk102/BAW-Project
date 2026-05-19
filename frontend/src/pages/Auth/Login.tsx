import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { Input } from '../../components/Shared/Input';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { demoAccounts, login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (loginEmail: string, loginPassword: string) => {
        setError('');
        setIsLoading(true);

        try {
            await login({ email: loginEmail, password: loginPassword });
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Nie udalo sie zalogowac.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleLogin(email, password);
    };

    return (
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-10">
            <Card className="w-full max-w-lg border border-[var(--color-line)] bg-white/90 p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Demo live</p>
                    <h1 className="mb-2 text-3xl font-black text-[var(--color-ink)]">Zaloguj sie na prawdziwe konto demo</h1>
                    <p className="text-sm text-[var(--color-muted)]">Oferty, zapytania i odpowiedzi zapisuja sie w bazie, wiec mozesz przechodzic miedzy kontami i testowac caly przeplyw.</p>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {demoAccounts.length > 0 && (
                    <div className="mb-6 grid gap-3">
                        {demoAccounts.map((account) => (
                            <button
                                key={account.email}
                                type="button"
                                onClick={() => {
                                    setEmail(account.email);
                                    setPassword(account.password);
                                    void handleLogin(account.email, account.password);
                                }}
                                className="rounded-2xl border border-[var(--color-line)] bg-[#fcfaf6] px-4 py-4 text-left transition hover:border-[var(--color-accent)]"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">{account.label}</p>
                                <p className="mt-1 font-bold text-[var(--color-ink)]">{account.email}</p>
                                <p className="text-sm text-[var(--color-muted)]">Haslo: {account.password}</p>
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input label="Adres e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anna@firma.pl" required />
                    <Input label="Haslo" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Wejdz do aplikacji
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-[var(--color-muted)]">
                    Chcesz dodac wlasne konto?{' '}
                    <Link to="/register" className="font-semibold text-[var(--color-accent)] hover:underline">
                        Zaloz profil
                    </Link>
                </div>
            </Card>
        </div>
    );
};
