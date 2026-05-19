import React, { useState } from 'react';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';

export const ClientReservations: React.FC = () => {
    const { clientInquiries, isLoading, replyToInquiry, addReview, markInquiryAsRead } = useMarketplace();
    const { currentUser } = useAuth();
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);

    // Review form state per inquiry
    const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
    const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    // Persisted set of inquiry IDs that have been reviewed — keyed by userId in localStorage
    const storageKey = `reviewed_inquiries_${currentUser?.id ?? 'anon'}`;
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
        } catch {
            return new Set<string>();
        }
    });

    const markAsReviewed = (inquiryId: string) => {
        const next = new Set([...reviewedIds, inquiryId]);
        setReviewedIds(next);
        try {
            localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch { /* ignore quota errors */ }
    };

    const statusBadge = (status: string) => {
        if (status === 'Zamkniete') return 'bg-red-100 text-red-700';
        if (status === 'Umowione') return 'bg-[#d7f0de] text-[#236041]';
        if (status === 'W trakcie') return 'bg-blue-100 text-blue-700';
        return 'bg-[var(--color-paper)] text-[var(--color-ink)]';
    };

    React.useEffect(() => {
        if (openId) {
            const inquiry = clientInquiries.find(i => i.id === openId);
            if (inquiry && inquiry.messages.some(m => m.author === 'provider' && !m.isRead)) {
                void markInquiryAsRead(openId);
            }
        }
    }, [openId, clientInquiries, markInquiryAsRead]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Klient</p>
                <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">Moje zapytania i ustalenia</h1>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white/80 py-20 text-center text-[var(--color-muted)]">
                    <p className="text-xl font-medium">Ladowanie zapytan...</p>
                </div>
            ) : clientInquiries.length > 0 ? (
                <div className="space-y-4">
                    {clientInquiries.map((inquiry) => {
                        const isOpen = openId === inquiry.id;
                        const isClosed = inquiry.status === 'Zamkniete';
                        const lastMessage = inquiry.messages[inquiry.messages.length - 1];
                        const alreadyReviewed = reviewedIds.has(inquiry.id);

                        return (
                            <Card key={inquiry.id} className="border border-[var(--color-line)] bg-white/90 overflow-hidden">
                                {/* Clickable header */}
                                <button
                                    className="w-full text-left p-6 hover:bg-[var(--color-paper)]/40 transition-colors"
                                    onClick={() => setOpenId(isOpen ? null : inquiry.id)}
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-[var(--color-ink)]">{inquiry.serviceTitle}</h3>
                                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                                                {inquiry.location} • {inquiry.preferredDate} • budzet {inquiry.budget}
                                            </p>
                                            {!isOpen && lastMessage && (
                                                <p className="mt-3 text-sm text-[var(--color-muted)] truncate max-w-lg">
                                                    <span className="font-semibold text-[var(--color-ink)]">
                                                        {lastMessage.author === 'provider' ? 'Wykonawca: ' : 'Ty: '}
                                                    </span>
                                                    {lastMessage.text}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusBadge(inquiry.status)}`}>
                                                {inquiry.status}
                                            </span>
                                            <span className="text-xs text-[var(--color-muted)] font-semibold">
                                                {inquiry.messages.length} wiad. {isOpen ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded panel */}
                                {isOpen && (
                                    <div className="border-t border-[var(--color-line)] p-6 pt-5 space-y-6">
                                        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                                            {/* Messages */}
                                            <div>
                                                <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Historia rozmowy</p>
                                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                                    {inquiry.messages.length === 0 ? (
                                                        <div className="rounded-2xl bg-[var(--color-paper)] p-4 text-sm text-[var(--color-muted)]">
                                                            Brak wiadomosci.
                                                        </div>
                                                    ) : (
                                                        inquiry.messages.map((message) => (
                                                            <div
                                                                key={message.id}
                                                                className={`rounded-2xl p-4 text-sm leading-6 ${
                                                                    message.author === 'client'
                                                                        ? 'bg-[var(--color-paper)] text-[var(--color-ink)]'
                                                                        : 'bg-[var(--color-ink)] text-white'
                                                                }`}
                                                            >
                                                                <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.16em] opacity-70">
                                                                    <span>{message.author === 'client' ? 'Ty' : 'Wykonawca'}</span>
                                                                    <span>{message.sentAt}</span>
                                                                </div>
                                                                {message.text}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reply form or closed info */}
                                            {!isClosed ? (
                                                <div>
                                                    <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Odpowiedz wykonawcy</p>
                                                    <textarea
                                                        className="min-h-[160px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25 text-sm"
                                                        value={drafts[inquiry.id] ?? ''}
                                                        onChange={(e) => setDrafts((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                                                        placeholder="Napisz wiadomosc do wykonawcy..."
                                                    />
                                                    <Button
                                                        className="mt-3 w-full"
                                                        isLoading={sendingId === inquiry.id}
                                                        onClick={async () => {
                                                            if (!drafts[inquiry.id]?.trim()) return;
                                                            setSendingId(inquiry.id);
                                                            try {
                                                                await replyToInquiry(inquiry.id, drafts[inquiry.id]);
                                                                setDrafts((prev) => ({ ...prev, [inquiry.id]: '' }));
                                                            } finally {
                                                                setSendingId(null);
                                                            }
                                                        }}
                                                    >
                                                        Wyslij wiadomosc
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl bg-[var(--color-paper)] p-4 flex items-center justify-center text-sm text-[var(--color-muted)]">
                                                    Zgloszenie zamkniete przez wykonawce.
                                                </div>
                                            )}
                                        </div>

                                        {/* Review section — only for closed inquiries */}
                                        {isClosed && !alreadyReviewed && (
                                            <div className="rounded-2xl border border-[#d7f0de] bg-[#f0faf3] p-5">
                                                <p className="text-sm font-bold text-[#236041] mb-4">⭐ Oceń wykonawcę</p>
                                                <div className="flex gap-2 mb-4">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setReviewRatings((prev) => ({ ...prev, [inquiry.id]: star }))}
                                                            className={`text-2xl transition ${
                                                                (reviewRatings[inquiry.id] ?? 0) >= star
                                                                    ? 'text-yellow-400'
                                                                    : 'text-gray-300 hover:text-yellow-300'
                                                            }`}
                                                        >
                                                            ★
                                                        </button>
                                                    ))}
                                                    {reviewRatings[inquiry.id] && (
                                                        <span className="ml-2 self-center text-sm font-semibold text-[var(--color-ink)]">
                                                            {reviewRatings[inquiry.id]}/5
                                                        </span>
                                                    )}
                                                </div>
                                                <textarea
                                                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25 text-sm mb-3"
                                                    value={reviewComments[inquiry.id] ?? ''}
                                                    onChange={(e) => setReviewComments((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                                                    placeholder="Opisz swoje doswiadczenie z wykonawca..."
                                                />
                                                <Button
                                                    isLoading={reviewingId === inquiry.id}
                                                    onClick={async () => {
                                                        const rating = reviewRatings[inquiry.id];
                                                        const comment = reviewComments[inquiry.id]?.trim();
                                                        if (!rating || !comment) return;
                                                        setReviewingId(inquiry.id);
                                                        try {
                                                            await addReview(inquiry.serviceId, rating, comment);
                                                            markAsReviewed(inquiry.id);
                                                        } finally {
                                                            setReviewingId(null);
                                                        }
                                                    }}
                                                >
                                                    Wyslij opinie
                                                </Button>
                                            </div>
                                        )}

                                        {isClosed && alreadyReviewed && (
                                            <div className="rounded-2xl bg-[#d7f0de] p-4 text-sm font-medium text-[#236041]">
                                                ✓ Dziękujemy za wystawienie opinii!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white/80 py-20 text-center text-[var(--color-muted)]">
                    <p className="text-xl font-medium">Nie masz jeszcze zadnych zapytan.</p>
                    <p className="mt-2 text-sm">Przejdz do oferty i wyslij pierwsze zapytanie.</p>
                </div>
            )}
        </div>
    );
};
