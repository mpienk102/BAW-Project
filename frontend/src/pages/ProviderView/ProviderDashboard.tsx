import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ProviderDashboard: React.FC = () => {
    const { isLoading, myServices, providerInquiries } = useMarketplace();
    const responseRate = myServices.length ? Math.round((providerInquiries.length / (providerInquiries.length + 1)) * 100) : 0;

    // Aggregate all reviews across all provider services
    const allReviews = myServices
        .flatMap((service) =>
            service.reviews.map((review) => ({
                ...review,
                serviceTitle: service.title,
                serviceId: service.id,
            }))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const avgRating = allReviews.length
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : '—';

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Wykonawca</p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--color-ink)]">Panel ofert i dostepnosci</h1>
                    <p className="mt-3 max-w-2xl text-[var(--color-muted)]">To sa realne dane Twojego konta. Dodaj oferte, potem przeloguj sie na klienta i odpowiedz na nia zapytaniem.</p>
                </div>
                <Link to="/provider/create-service" className="w-full lg:w-auto">
                    <Button>Dodaj nowa oferte</Button>
                </Link>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-4">
                <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                    <p className="text-sm text-[var(--color-muted)]">Aktywne oferty</p>
                    <p className="mt-2 text-4xl font-black text-[var(--color-ink)]">{myServices.length}</p>
                </Card>
                <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                    <p className="text-sm text-[var(--color-muted)]">Nowe zapytania</p>
                    <p className="mt-2 text-4xl font-black text-[var(--color-accent)]">{providerInquiries.length}</p>
                </Card>
                <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                    <p className="text-sm text-[var(--color-muted)]">Srednia ocena</p>
                    <p className="mt-2 text-4xl font-black text-[var(--color-ink)]">{avgRating}</p>
                    <p className="text-sm text-[var(--color-muted)]">{allReviews.length} opinii lacznie</p>
                </Card>
                <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                    <p className="text-sm text-[var(--color-muted)]">Response rate</p>
                    <p className="mt-2 text-4xl font-black text-[var(--color-ink)]">{responseRate}%</p>
                </Card>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white py-20 text-center text-[var(--color-muted)]">
                    <p className="text-xl font-medium">Ladowanie panelu...</p>
                </div>
            ) : myServices.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myServices.map((service) => (
                        <Card key={service.id} className="flex flex-col border border-[var(--color-line)] bg-white/90">
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="inline-block rounded-full bg-[var(--color-paper)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)]">{service.category}</span>
                                    <span className="text-xs font-semibold text-[var(--color-muted)]">{service.reviewCount} opinii</span>
                                </div>
                                <h3 className="text-xl font-black text-[var(--color-ink)]">{service.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{service.description}</p>
                                <div className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
                                    <p>Obszar: {service.cities.join(', ')}</p>
                                    <p>Cena: {service.price} zl {service.priceType === 'hourly' ? '/h' : 'ryczalt'}</p>
                                    <p>Dostepnosc: {service.availability.map((slot) => `${slot.day} ${slot.window}`).join(' • ')}</p>
                                </div>
                            </div>
                            <div className="mt-auto flex gap-3 border-t border-[var(--color-line)] bg-[#fcfaf6] px-6 py-4">
                                <Link to="/provider/reservations" className="flex-1">
                                    <Button variant="secondary" className="w-full text-xs py-1.5 px-3">Skrzynka zapytan</Button>
                                </Link>
                                <Link to={`/services/${service.id}`} className="flex-1">
                                    <Button variant="ghost" className="w-full text-xs py-1.5 px-3">Podglad</Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-12 text-center">
                    <h3 className="mb-1 text-lg font-medium text-[var(--color-ink)]">Nie masz jeszcze ofert</h3>
                    <p className="mb-6 text-[var(--color-muted)]">Dodaj pierwsza usluge i od razu pokaz ja klientom w wyszukiwarce.</p>
                    <Link to="/provider/create-service">
                        <Button>Dodaj oferte</Button>
                    </Link>
                </div>
            )}

            {/* All reviews aggregated from all services */}
            {!isLoading && allReviews.length > 0 && (
                <div className="mt-12">
                    <div className="mb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Opinie klientow</p>
                        <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Wszystkie oceny Twoich uslug</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {allReviews.map((review) => (
                            <Card key={review.id} className="border border-[var(--color-line)] bg-white/90 p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                        <p className="font-bold text-[var(--color-ink)]">{review.author}</p>
                                        <Link
                                            to={`/services/${review.serviceId}`}
                                            className="text-xs text-[var(--color-accent)] hover:underline"
                                        >
                                            {review.serviceTitle}
                                        </Link>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-paper)] px-3 py-1">
                                        <span className="text-yellow-400 text-sm">★</span>
                                        <span className="text-sm font-black text-[var(--color-ink)]">{review.rating}/5</span>
                                    </div>
                                </div>
                                <p className="text-sm leading-6 text-[var(--color-muted)]">{review.comment}</p>
                                <p className="mt-3 text-xs text-[var(--color-muted)]">
                                    {new Date(review.createdAt).toLocaleDateString('pl-PL')}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
