import React, { useState } from 'react';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ProviderReservations: React.FC = () => {
    const { isLoading, providerInquiries, replyToInquiry, closeInquiry, markInquiryAsRead } = useMarketplace();
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [closingId, setClosingId] = useState<string | null>(null);

    const statusBadge = (status: string) => {
        if (status === 'Zamkniete') return 'bg-red-100 text-red-700';
        if (status === 'Umowione') return 'bg-[#d7f0de] text-[#236041]';
        if (status === 'W trakcie') return 'bg-blue-100 text-blue-700';
        return 'bg-[var(--color-paper)] text-[var(--color-ink)]';
    };

    React.useEffect(() => {
        const unreads = providerInquiries.filter(i => i.messages.some(m => m.author === 'client' && !m.isRead));
        // To avoid burst of requests, we can just trigger them sequentially or all at once.
        if (unreads.length > 0) {
            unreads.forEach(i => void markInquiryAsRead(i.id));
        }
    }, [providerInquiries, markInquiryAsRead]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Wykonawca</p>
                <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">Skrzynka zapytan</h1>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white py-20 text-center text-[var(--color-muted)]">
                    <p className="text-xl font-medium">Ladowanie zapytan...</p>
                </div>
            ) : providerInquiries.length > 0 ? (
                <div className="space-y-4">
                    {providerInquiries.map((res) => {
                        const isClosed = res.status === 'Zamkniete';
                        return (
                            <Card key={res.id} className={`border border-[var(--color-line)] bg-white/92 p-6 ${isClosed ? 'opacity-60' : ''}`}>
                                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-[var(--color-ink)]">{res.serviceTitle}</h3>
                                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                                            Klient: <span className="font-semibold text-[var(--color-ink)]">{res.customerName}</span>
                                        </p>
                                        <p className="text-sm text-[var(--color-muted)]">{res.location} • {res.preferredDate} • budzet {res.budget}</p>
                                        <div className="mt-3 rounded-2xl bg-[var(--color-paper)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                                            {res.summary}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusBadge(res.status)}`}>
                                            {res.status}
                                        </span>
                                        {!isClosed && (
                                            <Button
                                                variant="secondary"
                                                isLoading={closingId === res.id}
                                                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (!confirm('Czy na pewno chcesz zamknac to zgloszenie?')) return;
                                                    setClosingId(res.id);
                                                    try {
                                                        await closeInquiry(res.id);
                                                    } finally {
                                                        setClosingId(null);
                                                    }
                                                }}
                                            >
                                                Zamknij zgloszenie
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-6 border-t border-[var(--color-line)] pt-5 lg:grid-cols-[0.9fr_1.1fr]">
                                    <div>
                                        <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Historia rozmowy</p>
                                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                            {res.messages.length === 0 ? (
                                                <div className="rounded-2xl bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                                                    Brak wiadomosci.
                                                </div>
                                            ) : res.messages.map((message) => (
                                                <div key={message.id} className={`rounded-2xl p-4 text-sm leading-6 ${message.author === 'provider' ? 'bg-[var(--color-ink)] text-white' : 'bg-[#fcfaf6] text-[var(--color-muted)]'}`}>
                                                    <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.16em] opacity-70">
                                                        <span>{message.author === 'provider' ? 'Ty (Wykonawca)' : 'Klient'}</span>
                                                        <span>{message.sentAt}</span>
                                                    </div>
                                                    {message.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {!isClosed ? (
                                        <div>
                                            <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Odpowiedz klientowi</p>
                                            <textarea
                                                className="min-h-[140px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25 text-sm"
                                                value={drafts[res.id] ?? ''}
                                                onChange={(e) => setDrafts((prev) => ({ ...prev, [res.id]: e.target.value }))}
                                                placeholder="Napisz krotka odpowiedz, potwierdz termin albo popros o zdjecia."
                                            />
                                            <div className="mt-3 flex gap-3">
                                                <Button
                                                    className="flex-1"
                                                    isLoading={sendingId === res.id}
                                                    onClick={async () => {
                                                        if (!drafts[res.id]?.trim()) return;
                                                        setSendingId(res.id);
                                                        try {
                                                            await replyToInquiry(res.id, drafts[res.id]);
                                                            setDrafts((prev) => ({ ...prev, [res.id]: '' }));
                                                        } finally {
                                                            setSendingId(null);
                                                        }
                                                    }}
                                                >
                                                    Wyslij odpowiedz
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center rounded-2xl bg-[var(--color-paper)] p-6 text-sm text-[var(--color-muted)]">
                                            Zgloszenie zostalo zamkniete.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white py-20 text-center text-[var(--color-muted)]">
                    <p className="text-xl font-medium">Nie masz jeszcze nowych zapytan.</p>
                </div>
            )}
        </div>
    );
};
