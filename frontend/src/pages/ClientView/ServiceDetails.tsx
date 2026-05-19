import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { GuestAuthGate } from '../../components/Shared/GuestAuthGate';
import { Input } from '../../components/Shared/Input';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ServiceDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { findServiceById, isLoading, sendInquiry } = useMarketplace();
    const [budget, setBudget] = useState('600 zl');
    const [preferredDate, setPreferredDate] = useState('Ten weekend');
    const [location, setLocation] = useState('Warszawa, Sadyba');
    const [clientMessage, setClientMessage] = useState('Szukam wykonawcy do pomalowania salonu 25m2. Zalezy mi na szybkiej realizacji i cenie do 600 zl.');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const service = id ? findServiceById(id) : undefined;

    if (isLoading && !service) {
        return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[var(--color-muted)]">Ladowanie oferty...</div>;
    }

    if (!service) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <p className="text-lg text-[var(--color-muted)]">Nie znaleziono tej oferty.</p>
                <Button className="mt-4" onClick={() => navigate('/')}>
                    Wroc do listy
                </Button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setIsSubmitting(true);
        try {
            await sendInquiry(id, {
                brief: clientMessage,
                budget,
                preferredDate,
                customerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
                location
            });
            setIsSent(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-8">
                    <div>
                        <button onClick={() => navigate('/')} className="mb-4 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                            ← Wroc do wynikow
                        </button>
                        <span className="inline-block rounded-full bg-[var(--color-paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                            {service.category}
                        </span>
                        <h1 className="mt-4 text-4xl font-black leading-tight text-[var(--color-ink)]">{service.title}</h1>
                        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-muted)]">{service.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                            <p className="text-sm text-[var(--color-muted)]">Cena startowa</p>
                            <p className="mt-2 text-3xl font-black text-[var(--color-accent)]">{service.price} zl</p>
                            <p className="text-sm text-[var(--color-muted)]">{service.priceType === 'hourly' ? 'za godzine' : 'za calosc'}</p>
                        </Card>
                        <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                            <p className="text-sm text-[var(--color-muted)]">Ocena</p>
                            <p className="mt-2 text-3xl font-black text-[var(--color-ink)]">{service.rating.toFixed(1)}</p>
                            <p className="text-sm text-[var(--color-muted)]">{service.reviewCount} opinii</p>
                        </Card>
                        <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                            <p className="text-sm text-[var(--color-muted)]">Zasieg</p>
                            <p className="mt-2 text-3xl font-black text-[var(--color-ink)]">{service.radiusKm} km</p>
                            <p className="text-sm text-[var(--color-muted)]">{service.locationLabel}</p>
                        </Card>
                        <Card className="border border-[var(--color-line)] bg-white/88 p-5">
                            <p className="text-sm text-[var(--color-muted)]">Tempo</p>
                            <p className="mt-2 text-3xl font-black text-[var(--color-ink)]">{service.responseTime}</p>
                            <p className="text-sm text-[var(--color-muted)]">{service.turnaround}</p>
                        </Card>
                    </div>

                    <Card className="border border-[var(--color-line)] bg-white/88 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Wykonawca</p>
                                <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">{service.provider.company}</h2>
                                <p className="mt-1 font-semibold text-[var(--color-ink)]">{service.provider.name}</p>
                            </div>
                            <div className="rounded-2xl bg-[var(--color-paper)] px-4 py-3 text-right">
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Zaufanie</p>
                                <p className="mt-1 font-semibold text-[var(--color-ink)]">{service.provider.verifiedLabel}</p>
                            </div>
                        </div>
                        <p className="mt-4 leading-7 text-[var(--color-muted)]">{service.provider.bio}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {service.highlights.map((item) => (
                                <span key={item} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-muted)]">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </Card>

                    <Card className="border border-[var(--color-line)] bg-white/88 p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Portfolio</p>
                                <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Poprzednie realizacje</h2>
                            </div>
                            <p className="text-sm text-[var(--color-muted)]">{service.completedJobs} zlecen</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {service.portfolio.map((photo, index) => (
                                <div key={photo} className="group relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-paper)]">
                                    <img 
                                        src={photo} 
                                        alt={`${service.title} portfolio ${index + 1}`} 
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border border-[var(--color-line)] bg-white/88 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Dostępność</p>
                        <div className="mt-5 flex flex-col gap-3">
                            {service.availability && service.availability.length > 0 ? (
                                service.availability.map((slot, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-xl bg-[var(--color-paper)] px-5 py-3 text-sm">
                                        <span className="font-semibold text-[var(--color-ink)]">{slot.day}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[var(--color-muted)] font-medium">{slot.window}</span>
                                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${slot.status === 'available' ? 'bg-[#d7f0de] text-[#236041]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                                                {slot.status === 'available' ? 'Dostępny' : 'Zajęty / Inne'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-[var(--color-muted)]">Wykonawca nie podał godzin dostępności.</p>
                            )}
                        </div>
                    </Card>

                    <Card className="border border-[var(--color-line)] bg-white/88 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Warunki wspolpracy</p>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {service.conditions.map((item, index) => (
                                <div key={index} className="rounded-2xl bg-[var(--color-paper)] p-4 text-sm leading-6 text-[var(--color-muted)] border border-transparent hover:border-[var(--color-line)] transition-all">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border border-[var(--color-line)] bg-white/88 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Opinie klientow</p>
                        <div className="mt-5 space-y-4">
                            {service.reviews.map((review) => (
                                <div key={review.id} className="rounded-2xl border border-[var(--color-line)] p-4">
                                    <div className="flex items-center justify-between">
                                        <strong className="text-[var(--color-ink)]">{review.author}</strong>
                                        <span className="text-sm text-[var(--color-muted)]">{review.rating}/5</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
                    {currentUser?.role === 'Client' ? (
                        <Card className="border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,224,207,0.9))] p-6 shadow-xl">
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Szybkie zapytanie</p>
                            <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Wyslij brief i zacznij czat</h2>
                            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                <Input label="Konto klienta" value={`${currentUser.firstName} ${currentUser.lastName}`} readOnly />
                                <Input label="Budzet" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                                <Input label="Preferowany termin" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} required />
                                <Input label="Lokalizacja" value={location} onChange={(e) => setLocation(e.target.value)} required />
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Opis potrzeb</label>
                                    <textarea
                                        className="min-h-[160px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25"
                                        value={clientMessage}
                                        onChange={(e) => setClientMessage(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                                    Wyslij zapytanie
                                </Button>
                            </form>
                            {isSent && (
                                <div className="mt-4 rounded-2xl bg-[#d7f0de] p-4 text-sm font-medium text-[#236041]">
                                    Zapytanie wysłane! Odpowiedzi znajdziesz w sekcji "Moje zapytania".
                                </div>
                            )}
                        </Card>
                    ) : currentUser?.role === 'Provider' ? (
                        <Card className="border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,224,207,0.9))] p-6 shadow-xl">
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Tryb Podglądu</p>
                            <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Twoja oferta</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                                Tak Twoja oferta prezentuje się potencjalnym klientom. Wykorzystaj ten panel jako potwierdzenie widoczności wszystkich najistotniejszych atrybutów.
                            </p>
                            <div className="mt-5 flex flex-col gap-3">
                                <Button className="w-full text-xs" onClick={() => navigate(`/provider/edit-service/${id}`)}>
                                    Edytuj ofertę
                                </Button>
                                <Button className="w-full text-xs" onClick={() => navigate('/provider/reservations')}>
                                    Przejdź do Skrzynki Zapytań
                                </Button>
                                <Button variant="secondary" className="w-full text-xs" onClick={() => navigate('/provider')}>
                                    Wróć do Dashboardu
                                </Button>
                            </div>
                        </Card>
                    ) : currentUser?.role === 'Admin' ? (
                        <Card className="border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,224,207,0.9))] p-6 shadow-xl">
                            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-muted)]">Panel Administracyjny</p>
                            <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Podgląd systemu</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Jesteś zalogowany jako Administartor systemu GRU.</p>
                        </Card>
                    ) : (
                        <GuestAuthGate actionLabel="wysyłać zapytań do usługodawców" />
                    )}

                </div>
            </div>
        </div>
    );
};
