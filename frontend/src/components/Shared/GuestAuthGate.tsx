import React from 'react';
import { Link } from 'react-router-dom';

interface GuestAuthGateProps {
    /** Treść akcji której nie można wykonać, np. "wysyłać zapytań" */
    actionLabel?: string;
}

/**
 * Pokazuje się zamiast akcji wymagających logowania.
 * Informuje gościa co jest możliwe po rejestracji i kieruje do /register lub /login.
 */
export const GuestAuthGate: React.FC<GuestAuthGateProps> = ({
    actionLabel = 'wysyłać zapytań do usługodawców',
}) => {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(236,224,207,0.88))] p-8 shadow-xl">
            {/* Decorative blob */}
            <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, var(--color-accent), transparent 70%)' }}
            />

            <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-2xl shadow-md">
                    🔐
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">
                    Wymagane konto
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-[var(--color-ink)]">
                    Załóż konto, żeby {actionLabel}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    Przeglądanie ofert jest w pełni darmowe i nie wymaga rejestracji.
                    Aby skontaktować się z usługodawcą, wystarczy założyć konto — zajmuje to mniej niż minutę.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        to="/register"
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-95"
                    >
                        Utwórz darmowe konto →
                    </Link>
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white active:scale-95"
                    >
                        Mam już konto — zaloguj
                    </Link>
                </div>

                {/* Feature bullets */}
                <ul className="mt-6 space-y-2">
                    {[
                        'Wysyłaj zapytania i rozmawiaj z wykonawcami',
                        'Obserwuj status swoich zleceń',
                        'Wystaw opinię po wykonanej usłudze',
                        'Sam zacznij oferować usługi',
                    ].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                            <span className="text-[var(--color-accent)]">✓</span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
