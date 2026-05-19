import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { Input } from '../../components/Shared/Input';
import { useAuth } from '../../context/AuthContext';

export const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        companyName: '',
        bio: '',
        phoneNumber: '',
        role: 'Client' as 'Client' | 'Provider'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register(formData);
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Nie udalo sie zalozyc konta.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-10">
            <Card className="w-full max-w-xl border border-[var(--color-line)] bg-white/85 p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Onboarding live</p>
                    <h1 className="mb-2 text-3xl font-black text-[var(--color-ink)]">Zaloz konto do testow</h1>
                    <p className="text-sm text-[var(--color-muted)]">Po rejestracji od razu mozesz zalogowac sie i tworzyc oferty albo wysylac zapytania.</p>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Imie" name="firstName" value={formData.firstName} onChange={handleChange} required />
                        <Input label="Nazwisko" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-2">
                        <span className="text-sm font-medium text-gray-700">Wybierz typ konta</span>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-sm font-semibold transition ${formData.role === 'Client' ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white' : 'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-gray-50'}`}>
                                <input type="radio" name="role" value="Client" checked={formData.role === 'Client'} onChange={handleChange} className="hidden" />
                                Klient
                            </label>
                            <label className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-sm font-semibold transition ${formData.role === 'Provider' ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-gray-50'}`}>
                                <input type="radio" name="role" value="Provider" checked={formData.role === 'Provider'} onChange={handleChange} className="hidden" />
                                Wykonawca
                            </label>
                        </div>
                    </div>
                    <Input label="E-mail" type="email" name="email" value={formData.email} onChange={handleChange} required />
                    <Input label="Haslo" type="password" name="password" value={formData.password} onChange={handleChange} required />
                    <Input label="Nazwa firmy" name="companyName" value={formData.companyName} onChange={handleChange} />
                    <Input label="Telefon" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25"
                        />
                    </div>
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Utworz konto
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-[var(--color-muted)]">
                    Masz juz konto?{' '}
                    <Link to="/login" className="font-semibold text-[var(--color-accent)] hover:underline">
                        Zaloguj sie
                    </Link>
                </div>
            </Card>
        </div>
    );
};
