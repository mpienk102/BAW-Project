import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Button } from '../Shared/Button';

export const Navbar: React.FC = () => {
    const { isAuthenticated, currentUser, logout } = useAuth();
    const { resetDemo, clientInquiries, providerInquiries } = useMarketplace();
    const hasUnreadClient = clientInquiries.some(i => i.messages.some(m => m.author === 'provider' && !m.isRead));
    const hasUnreadProvider = providerInquiries.some(i => i.messages.some(m => m.author === 'client' && !m.isRead));
    const [isResetting, setIsResetting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-40 w-full border-b border-white/40 bg-[rgba(247,242,234,0.82)] backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-2xl font-black uppercase tracking-[0.16em] text-[var(--color-ink)] cursor-pointer"
                    >
                        Facho
                    </button>
                    <div className="hidden rounded-full border border-[var(--color-line)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--color-muted)] md:block">
                        Gielda lokalnych uslug
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isAuthenticated && (
                        <>
                            <div className="hidden rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-2 text-sm md:block">
                                <div className="font-semibold text-[var(--color-ink)]">{currentUser?.firstName} {currentUser?.lastName}</div>
                                <div className="text-xs text-[var(--color-muted)]">{currentUser?.email} - {currentUser?.role}</div>
                            </div>
                        </>
                    )}

                    {isAuthenticated ? (
                        <>
                            {currentUser?.role !== 'Admin' && (
                                <Link
                                    to={currentUser?.role === 'Client' ? '/client/reservations' : '/provider/reservations'}
                                    className="hidden md:flex relative items-center gap-2 rounded-[1rem] bg-white/70 px-5 py-2 text-sm font-bold text-[var(--color-ink)] shadow-sm ring-1 ring-[var(--color-line)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                                >
                                    <span>{currentUser?.role === 'Client' ? 'Moje zapytania' : 'Skrzynka zapytan'}</span>
                                    {((currentUser?.role === 'Client' && hasUnreadClient) || (currentUser?.role === 'Provider' && hasUnreadProvider)) && (
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm"></span>
                                        </span>
                                    )}
                                </Link>
                            )}
                            <Button
                                variant="secondary"
                                isLoading={isResetting}
                                onClick={async () => {
                                    setIsResetting(true);
                                    try {
                                        await resetDemo();
                                    } finally {
                                        setIsResetting(false);
                                    }
                                }}
                            >
                                Reset demo
                            </Button>
                            <Button variant="ghost" className="text-[var(--color-muted)]" onClick={logout}>
                                Wyloguj
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            {location.pathname !== '/login' && (
                                <Link to="/login">
                                    <Button variant="ghost">Logowanie</Button>
                                </Link>
                            )}
                            {location.pathname !== '/register' && (
                                <Link to="/register">
                                    <Button>Zaloz konto</Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
