import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
    users: number;
    services: number;
    reviews: number;
    inquiries: number;
    reservations: number;
}

interface AdminUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string | null;
    role: string;
    isEmailVerified: boolean;
    isBlocked: boolean;
    createdAt: string;
    servicesCount: number;
}

interface AdminService {
    id: string;
    title: string;
    isActive: boolean;
    createdAt: string;
    category: string;
    provider: string;
    providerEmail: string;
    reviewsCount: number;
}

interface AdminReview {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    service: string;
    author: string;
    authorEmail: string;
}

type Tab = 'stats' | 'users' | 'services' | 'reviews';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <span className="text-amber-500">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
);

const Badge: React.FC<{ ok: boolean; trueLabel: string; falseLabel: string }> = ({ ok, trueLabel, falseLabel }) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {ok ? trueLabel : falseLabel}
    </span>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => (
    <div className={`relative overflow-hidden rounded-2xl border border-white/30 bg-white/60 p-6 shadow-sm backdrop-blur-sm`}>
        <div className={`absolute -right-4 -top-4 text-7xl opacity-10 ${color}`}>{icon}</div>
        <div className="text-3xl font-black text-[var(--color-ink)]">{value.toLocaleString('pl')}</div>
        <div className="mt-1 text-sm font-medium text-[var(--color-muted)]">{label}</div>
    </div>
);

// ─── Action buttons ───────────────────────────────────────────────────────────

const DeleteBtn: React.FC<{ onClick: () => void; loading: boolean }> = ({ onClick, loading }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
    >
        {loading ? '…' : 'Usuń'}
    </button>
);

const BlockBtn: React.FC<{ isBlocked: boolean; onClick: () => void; loading: boolean }> = ({ isBlocked, onClick, loading }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            isBlocked
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
        }`}
    >
        {loading ? '…' : isBlocked ? 'Odblokuj' : 'Zablokuj'}
    </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const AdminPanel: React.FC = () => {
    const { currentUser } = useAuth();

    const [tab, setTab] = useState<Tab>('stats');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [services, setServices] = useState<AdminService[]>([]);
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Guard — nie-admin nie powinien tu trafić, ale na wszelki wypadek
    if (currentUser?.role !== 'Admin') {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <div className="text-5xl">🔒</div>
                <p className="text-lg font-semibold text-[var(--color-ink)]">Brak dostępu</p>
                <a href="/" className="rounded-xl bg-[var(--color-ink)] px-6 py-2 text-sm font-semibold text-white">
                    Wróć na stronę główną
                </a>
            </div>
        );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        void fetchStats();
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (tab === 'stats' && !stats) void fetchStats();
        if (tab === 'users' && !users.length) void fetchUsers();
        if (tab === 'services' && !services.length) void fetchServices();
        if (tab === 'reviews' && !reviews.length) void fetchReviews();
    }, [tab]);

    const fetchStats    = async () => { try { const r = await api.get('/admin/stats');    setStats(r.data); } catch { setError('Błąd ładowania statystyk'); } };
    const fetchUsers    = async () => { try { const r = await api.get('/admin/users');    setUsers(r.data); } catch { setError('Błąd ładowania użytkowników'); } };
    const fetchServices = async () => { try { const r = await api.get('/admin/services'); setServices(r.data); } catch { setError('Błąd ładowania usług'); } };
    const fetchReviews  = async () => { try { const r = await api.get('/admin/reviews');  setReviews(r.data); } catch { setError('Błąd ładowania recenzji'); } };

    const deleteUser = async (id: string) => {
        setLoadingId(id + '_del');
        try { await api.delete(`/admin/users/${id}`); setUsers(p => p.filter(u => u.id !== id)); }
        catch { setError('Nie można usunąć użytkownika'); }
        finally { setLoadingId(null); }
    };

    const toggleBlock = async (id: string) => {
        setLoadingId(id + '_block');
        try {
            const r = await api.patch(`/admin/users/${id}/block`);
            setUsers(p => p.map(u => u.id === id ? { ...u, isBlocked: r.data.isBlocked } : u));
        } catch { setError('Nie można zmienić stanu blokady'); }
        finally { setLoadingId(null); }
    };

    const deleteService = async (id: string) => {
        setLoadingId(id);
        try { await api.delete(`/admin/services/${id}`); setServices(p => p.filter(s => s.id !== id)); }
        catch { setError('Nie można usunąć usługi'); }
        finally { setLoadingId(null); }
    };

    const deleteReview = async (id: string) => {
        setLoadingId(id);
        try { await api.delete(`/admin/reviews/${id}`); setReviews(p => p.filter(r => r.id !== id)); }
        catch { setError('Nie można usunąć recenzji'); }
        finally { setLoadingId(null); }
    };

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'stats',    label: 'Statystyki',   icon: '📊' },
        { key: 'users',    label: 'Użytkownicy',  icon: '👥' },
        { key: 'services', label: 'Usługi',        icon: '🛠️' },
        { key: 'reviews',  label: 'Recenzje',      icon: '⭐' },
    ];

    // Helper: is this the currently logged-in admin or another Admin?
    const isSelf = (id: string) => id === currentUser.id;
    const isAdminRow = (u: AdminUser) => u.role === 'Admin';

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl shadow-lg">
                    🛡️
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[var(--color-ink)]">Panel Administratora</h1>
                    <p className="text-sm text-[var(--color-muted)]">Zalogowany jako: {currentUser.firstName} {currentUser.lastName}</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 font-bold">✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
                            tab === t.key
                                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md'
                                : 'bg-white/70 text-[var(--color-muted)] hover:text-[var(--color-ink)] border border-[var(--color-line)]'
                        }`}
                    >
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* ── STATS ── */}
            {tab === 'stats' && stats && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Użytkownicy"  value={stats.users}        icon="👤" color="text-violet-400" />
                    <StatCard label="Usługi"        value={stats.services}     icon="🛠" color="text-indigo-400" />
                    <StatCard label="Recenzje"      value={stats.reviews}      icon="⭐" color="text-amber-400"  />
                    <StatCard label="Zapytania"     value={stats.inquiries}    icon="💬" color="text-sky-400"    />
                    <StatCard label="Rezerwacje"    value={stats.reservations} icon="📅" color="text-emerald-400" />
                </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
                <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/70 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-line)] bg-white/60">
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Użytkownik</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Email</th>
                                    <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">Rola</th>
                                    <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">Usługi</th>
                                    <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">Status</th>
                                    <th className="px-4 py-3 text-right font-semibold text-[var(--color-muted)]">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr
                                        key={u.id}
                                        className={`border-b border-[var(--color-line)] last:border-0 hover:bg-white/50 ${u.isBlocked ? 'bg-rose-50/40' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                                            {u.firstName} {u.lastName}
                                            {u.companyName && <span className="ml-2 text-xs text-[var(--color-muted)]">({u.companyName})</span>}
                                            {u.isBlocked && <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">🔒 Zablokowany</span>}
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-muted)]">{u.email}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                u.role === 'Admin'
                                                    ? 'bg-violet-100 text-violet-700'
                                                    : u.role === 'Provider'
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {u.role === 'Admin' ? '🛡️ Admin' : u.role === 'Provider' ? '🔧 Wykonawca' : '👤 Klient'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">{u.servicesCount}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge ok={u.isEmailVerified} trueLabel="Zweryfikowany" falseLabel="Niezweryfikowany" />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Blokada – niedostępna dla admina i własnego konta */}
                                                {!isAdminRow(u) && !isSelf(u.id) && (
                                                    <BlockBtn
                                                        isBlocked={u.isBlocked}
                                                        onClick={() => void toggleBlock(u.id)}
                                                        loading={loadingId === u.id + '_block'}
                                                    />
                                                )}
                                                {/* Usuwanie – niedostępne dla admina i własnego konta */}
                                                {!isAdminRow(u) && !isSelf(u.id) && (
                                                    <DeleteBtn
                                                        onClick={() => void deleteUser(u.id)}
                                                        loading={loadingId === u.id + '_del'}
                                                    />
                                                )}
                                                {/* Tekst zastępczy dla własnego konta lub admina */}
                                                {(isAdminRow(u) || isSelf(u.id)) && (
                                                    <span className="text-xs text-[var(--color-muted)] italic">
                                                        {isSelf(u.id) ? 'Twoje konto' : 'Brak akcji'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!users.length && (
                                    <tr><td colSpan={6} className="py-10 text-center text-[var(--color-muted)]">Ładowanie…</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── SERVICES ── */}
            {tab === 'services' && (
                <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/70 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-line)] bg-white/60">
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Tytuł</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Kategoria</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Usługodawca</th>
                                    <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">Recenzje</th>
                                    <th className="px-4 py-3 text-center font-semibold text-[var(--color-muted)]">Status</th>
                                    <th className="px-4 py-3 text-right font-semibold text-[var(--color-muted)]">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(s => (
                                    <tr key={s.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-white/50">
                                        <td className="max-w-xs px-4 py-3 font-medium text-[var(--color-ink)]">
                                            <div className="truncate">{s.title}</div>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--color-muted)]">{s.category}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-[var(--color-ink)]">{s.provider}</div>
                                            <div className="text-xs text-[var(--color-muted)]">{s.providerEmail}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">{s.reviewsCount}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge ok={s.isActive} trueLabel="Aktywna" falseLabel="Nieaktywna" />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DeleteBtn onClick={() => void deleteService(s.id)} loading={loadingId === s.id} />
                                        </td>
                                    </tr>
                                ))}
                                {!services.length && (
                                    <tr><td colSpan={6} className="py-10 text-center text-[var(--color-muted)]">Ładowanie…</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── REVIEWS ── */}
            {tab === 'reviews' && (
                <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/70 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-line)] bg-white/60">
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Ocena</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Komentarz</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Usługa</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Autor</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Data</th>
                                    <th className="px-4 py-3 text-right font-semibold text-[var(--color-muted)]">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map(r => (
                                    <tr key={r.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-white/50">
                                        <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                                        <td className="max-w-xs px-4 py-3 text-[var(--color-muted)]">
                                            <div className="truncate">{r.comment}</div>
                                        </td>
                                        <td className="max-w-[160px] px-4 py-3 text-[var(--color-ink)]">
                                            <div className="truncate">{r.service}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-[var(--color-ink)]">{r.author}</div>
                                            <div className="text-xs text-[var(--color-muted)]">{r.authorEmail}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                                            {new Date(r.createdAt).toLocaleDateString('pl')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DeleteBtn onClick={() => void deleteReview(r.id)} loading={loadingId === r.id} />
                                        </td>
                                    </tr>
                                ))}
                                {!reviews.length && (
                                    <tr><td colSpan={6} className="py-10 text-center text-[var(--color-muted)]">Ładowanie…</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
