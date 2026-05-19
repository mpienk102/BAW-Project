import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Shared/Card';
import { Input } from '../../components/Shared/Input';
import { ServiceMap } from '../../components/Shared/ServiceMap';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';

export const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { services, isLoading } = useMarketplace();
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('Warszawa');
    const [radius, setRadius] = useState(20);
    const [sortBy, setSortBy] = useState<'price' | 'rating' | 'speed'>('rating');

    const filteredServices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return [...services]
            .filter((service) => {
                const matchesQuery =
                    !query ||
                    service.title.toLowerCase().includes(query) ||
                    service.description.toLowerCase().includes(query) ||
                    service.category.toLowerCase().includes(query);
                const matchesCity = city ? service.cities.some((item) => item.toLowerCase().includes(city.toLowerCase())) : true;
                const matchesRadius = service.radiusKm >= radius - 5;
                return matchesQuery && matchesCity && matchesRadius;
            })
            .sort((a, b) => {
                if (sortBy === 'price') return a.price - b.price;
                if (sortBy === 'speed') return a.responseTime.localeCompare(b.responseTime);
                return b.rating - a.rating;
            });
    }, [services, search, city, radius, sortBy]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Banner dla gości */}
            {!isAuthenticated && (
                <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">👀</span>
                        <div>
                            <p className="text-sm font-semibold text-amber-900">Przeglądasz jako gość</p>
                            <p className="text-xs text-amber-700">Możesz przeglądać oferty. Aby wysłać zapytanie, zarejestruj się — to nic nie kosztuje.</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Link to="/login" className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-50">
                            Zaloguj
                        </Link>
                        <Link to="/register" className="rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-800">
                            Zarejestruj →
                        </Link>
                    </div>
                </div>
            )}
            <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="flex flex-col gap-8">
                    <Card className="overflow-hidden border border-[var(--color-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(236,224,207,0.82))] p-8 shadow-xl">
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[var(--color-muted)]">Marketplace live demo</p>
                        <h1 className="text-4xl font-black leading-tight text-[var(--color-ink)] sm:text-5xl">
                            Znajdz wykonawce po cenie, zasiegu i realnym terminie, a potem przetestuj przeplyw na drugim koncie.
                        </h1>
                        <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
                            Tutaj wszystko idzie juz do backendu. Mozesz dodac oferte jako wykonawca, wylogowac sie, wejsc na konto klienta i wyslac prawdziwe zapytanie.
                        </p>

                        <div className="mt-8 grid gap-4 grid-cols-1">
                            <Input label="Jakiej uslugi szukasz?" type="search" placeholder="np. malowanie, sprzatanie, elektryk" value={search} onChange={(e) => setSearch(e.target.value)} />
                            <Input label="Miasto lub okolica" value={city} onChange={(e) => setCity(e.target.value)} />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Sortowanie</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'price' | 'rating' | 'speed')} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25">
                                    <option value="rating">Najlepiej oceniane</option>
                                    <option value="price">Najnizsza cena</option>
                                    <option value="speed">Najszybsza odpowiedz</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <div>
                        <div className="mb-5">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Oferty w okolicy</p>
                            <h2 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{isLoading ? 'Ladowanie...' : `${filteredServices.length} wykonawcow do porownania`}</h2>
                        </div>

                        <div className="grid gap-5">
                            {filteredServices.map((service) => (
                                <Link to={`/services/${service.id}`} key={service.id}>
                                    <Card className="border border-[var(--color-line)] bg-white/88 p-6 shadow-lg transition hover:-translate-y-1">
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex-1">
                                                <div className="mb-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-[var(--color-paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">{service.category}</span>
                                                    <span className="rounded-full bg-[#d7f0de] px-3 py-1 text-xs font-semibold text-[#236041]">{service.turnaround}</span>
                                                </div>
                                                <h3 className="text-2xl font-black text-[var(--color-ink)]">{service.title}</h3>
                                                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{service.description}</p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {service.highlights.map((item) => (
                                                        <span key={item} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-muted)]">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="w-full rounded-[1.5rem] bg-[var(--color-paper)] p-5 lg:w-64 shrink-0">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--color-muted)] max-w-28 truncate" title={service.provider.company}>{service.provider.company}</p>
                                                        <p className="text-lg font-black text-[var(--color-ink)]">{service.provider.name}</p>
                                                    </div>
                                                    <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm shrink-0 ml-2">
                                                        <div className="text-lg font-black text-[var(--color-ink)]">{service.rating.toFixed(1)}</div>
                                                        <div className="text-xs text-[var(--color-muted)]">{service.reviewCount} opinii</div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-end justify-between">
                                                    <div>
                                                        <p className="text-sm text-[var(--color-muted)]">Cena</p>
                                                        <p className="text-2xl font-black text-[var(--color-accent)] leading-none">
                                                            {service.price} zl
                                                            <span className="ml-1 text-xs font-semibold text-[var(--color-muted)]">{service.priceType === 'hourly' ? '/h' : 'ryczalt'}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-xs text-[var(--color-muted)]">
                                                        <p>{service.locationLabel}</p>
                                                        <p>{service.responseTime}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="sticky top-24">
                        <Card className="border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(230,238,234,0.85))] p-6 shadow-lg">
                            <div className="flex flex-col gap-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Mapa zasiegu</p>
                                        <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Wykonawcy w okolicy</h2>
                                    </div>
                                    <span className="rounded-full border border-[var(--color-line)] bg-white/80 px-4 py-1.5 text-sm font-semibold text-[var(--color-ink)]">{radius} km</span>
                                </div>

                                <div className="rounded-[1.5rem] border border-amber-200/50 bg-white/60 p-4 shadow-sm">
                                    <div className="mb-2 flex items-center justify-between text-sm text-[var(--color-muted)]">
                                        <span className="font-semibold text-amber-900">Promien wyszukiwania</span>
                                        <strong className="text-amber-700">{radius} km od {city}</strong>
                                    </div>
                                    <input type="range" min={5} max={50} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
                                </div>

                                <div className="overflow-hidden rounded-[2rem] border border-[var(--color-line)]" style={{ height: 'calc(100vh - 380px)', minHeight: '300px', maxHeight: '600px' }}>
                                    <ServiceMap
                                        services={filteredServices}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
};
