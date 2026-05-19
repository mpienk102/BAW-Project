import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Layout/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ClientReservations } from './pages/ClientView/ClientReservations';
import { Home } from './pages/ClientView/Home';
import { ServiceDetails } from './pages/ClientView/ServiceDetails';
import { AdminPanel } from './pages/AdminView/AdminPanel';
import { CreateService } from './pages/ProviderView/CreateService';
import { ProviderDashboard } from './pages/ProviderView/ProviderDashboard';
import { ProviderReservations } from './pages/ProviderView/ProviderReservations';

const SESSION_TOKEN_QUERY_KEYS = ['token', 'access_token', 'authToken', 'sessionToken', 'jwt'];

const StripSessionTokenFromUrl: React.FC = () => {
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        // One-time migration: move token from localStorage -> sessionStorage to reduce persistence.
        const legacyToken = localStorage.getItem('token');
        if (legacyToken && !sessionStorage.getItem('token')) {
            sessionStorage.setItem('token', legacyToken);
            localStorage.removeItem('token');
        }

        const url = new URL(window.location.href);
        const params = url.searchParams;

        let foundToken: string | null = null;
        for (const key of SESSION_TOKEN_QUERY_KEYS) {
            const value = params.get(key);
            if (value) {
                if (!foundToken) foundToken = value;
                params.delete(key);
            }
        }

        // Preserve behavior (if any) while removing token from the address bar.
        // If a token arrives via URL, store it once and immediately scrub it.
        if (foundToken && !sessionStorage.getItem('token')) {
            sessionStorage.setItem('token', foundToken);
        }

        if (url.href !== window.location.href) {
            window.history.replaceState({}, document.title, url.toString());
        }
    }, []);

    return null;
};

const ProtectedAppRoutes = () => {
    const { currentUser } = useAuth();

    return (
        <Routes>
            <Route path="/" element={currentUser?.role === 'Provider' ? <ProviderDashboard /> : currentUser?.role === 'Admin' ? <AdminPanel /> : <Home />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/client/reservations" element={<ClientReservations />} />
            <Route path="/provider/create-service" element={<CreateService />} />
            <Route path="/provider/edit-service/:id" element={<CreateService />} />
            <Route path="/provider/reservations" element={<ProviderReservations />} />
            <Route path="/admin" element={currentUser?.role === 'Admin' ? <AdminPanel /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const AppRoutes = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex min-h-[calc(100vh-88px)] items-center justify-center text-sm text-[var(--color-muted)]">Ladowanie sesji...</div>;
    }

    return (
        <Routes>
            {/* Trasy publiczne – dostępne bez logowania */}
            <Route path="/"              element={isAuthenticated ? <ProtectedAppRoutes /> : <Home />} />
            <Route path="/services/:id"  element={<ServiceDetails />} />

            {/* Auth */}
            <Route path="/login"    element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

            {/* Chronione – wymagają logowania */}
            <Route path="/*" element={isAuthenticated ? <ProtectedAppRoutes /> : <Navigate to="/login" replace />} />
        </Routes>
    );
};

const BlockedAccountOverlay: React.FC = () => {
    const { currentUser, logout } = useAuth();
    if (!currentUser?.isBlocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">Konto zablokowane</h2>
                <p className="text-[var(--color-muted)] mb-6 leading-relaxed">
                    Twoje konto zostało zablokowane przez administratora.<br />
                    Skontaktuj się z administracją usługi w celu wyjaśnienia sprawy.
                </p>
                <button
                    onClick={logout}
                    className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-md hover:from-rose-600 hover:to-rose-700 transition"
                >
                    Wyloguj się
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MarketplaceProvider>
                <Router>
                    <div className="min-h-screen">
                        <StripSessionTokenFromUrl />
                        <BlockedAccountOverlay />
                        <Navbar />
                        <main>
                            <AppRoutes />
                        </main>
                    </div>
                </Router>
            </MarketplaceProvider>
        </AuthProvider>
    );
};

export default App;
