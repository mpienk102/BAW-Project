import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Shared/Button';
import { Card } from '../../components/Shared/Card';
import { Input } from '../../components/Shared/Input';
import { useMarketplace } from '../../context/MarketplaceContext';
import api from '../../services/api';

export const CreateService: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { createService, updateService, findServiceById, uploadImage } = useMarketplace();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Remonty');
    const [description, setDescription] = useState('');
    const [existingUrls, setExistingUrls] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [price, setPrice] = useState('600');
    const [priceType, setPriceType] = useState<'hourly' | 'fixed'>('fixed');
    const [cities, setCities] = useState('Warszawa, Piaseczno');
    const [radiusKm, setRadiusKm] = useState('20');
    const [availability, setAvailability] = useState<{ dayLabel: string; timeWindow: string; status: 'available' | 'busy' }[]>([
        { dayLabel: 'Pon-Pt', timeWindow: '09:00-17:00', status: 'available' },
        { dayLabel: 'Sob', timeWindow: '10:00-14:00', status: 'available' },
        { dayLabel: 'Nd', timeWindow: 'Na zapytanie', status: 'busy' }
    ]);
    const [customConditions, setCustomConditions] = useState<string[]>([
        'Zakres i finalna cena sa potwierdzane po krotkim briefie.',
        'Kontakt i ustalenia odbywaja sie w czacie wewnetrznym.',
        'Wykonawca sam potwierdza termin realizacji.'
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiCooldown, setAiCooldown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            const service = findServiceById(id);
            if (service) {
                setTitle(service.title);
                setCategory(service.category);
                setDescription(service.description);
                setPrice(service.price.toString());
                setPriceType(service.priceType);
                setCities(service.cities.join(', '));
                setRadiusKm(service.radiusKm.toString());
                setAvailability(service.availability.map(a => ({
                    dayLabel: a.day,
                    timeWindow: a.window,
                    status: a.status
                })));
                if (service.customConditions && service.customConditions.length > 0) {
                    setCustomConditions(service.customConditions);
                } else if (service.conditions && service.conditions.length > 0) {
                    // Fallback dla starszych danych
                    setCustomConditions(service.conditions);
                }
                if (service.portfolio && service.portfolio.length > 0) {
                    setExistingUrls(service.portfolio);
                }
            }
        }
    }, [id, findServiceById]);

    useEffect(() => {
        let timer: any;
        if (aiCooldown > 0) {
            timer = setInterval(() => {
                setAiCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [aiCooldown]);

    const handleConditionChange = (index: number, value: string) => {
        const newConditions = [...customConditions];
        newConditions[index] = value;
        setCustomConditions(newConditions);
    };

    const addCondition = () => {
        setCustomConditions([...customConditions, '']);
    };

    const removeCondition = (index: number) => {
        setCustomConditions(customConditions.filter((_, i) => i !== index));
    };

    const handleAvailabilityChange = (index: number, field: string, value: string) => {
        const newAvailability = [...availability];
        newAvailability[index] = { ...newAvailability[index], [field]: value } as any;
        setAvailability(newAvailability);
    };

    const addAvailabilitySlot = () => {
        setAvailability([...availability, { dayLabel: '', timeWindow: '', status: 'available' }]);
    };

    const removeAvailabilitySlot = (index: number) => {
        setAvailability(availability.filter((_, i) => i !== index));
    };

    const handleGenerateAi = async () => {
        if (!description.trim()) {
            // Jeśli opis jest pusty, wygenerujmy coś prostego na start
            const baseText = `Oferuje usluge "${title || 'Twoja usluga'}" na obszarze ${cities || 'wybranych miast'}. Zapraszam do kontaktu.`;
            setDescription(baseText);
            return;
        }

        setIsAiLoading(true);
        try {
            const response = await api.post('/Ai/improve-description', { text: description });
            if (response.data && response.data.description) {
                setDescription(response.data.description);
                setAiCooldown(60); // Start 60s cooldown
            }
        } catch (error) {
            console.error("AI Improvement failed:", error);
            alert("Nie udało się ulepszyć opisu. Spróbuj ponownie później.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let uploadedUrls: string[] = [];
            if (newFiles.length > 0) {
                uploadedUrls = await Promise.all(newFiles.map(f => uploadImage(f)));
            }

            const finalPhotoUrls = [...existingUrls, ...uploadedUrls];

            const payload = {
                title,
                category,
                description,
                price: Number(price),
                priceType,
                radiusKm: Number(radiusKm),
                cities: cities.split(',').map((item) => item.trim()).filter(Boolean),
                photoUrls: finalPhotoUrls,
                availability: availability.filter(a => a.dayLabel.trim() !== ''),
                customConditions: customConditions.filter(c => c.trim() !== '')
            };

            if (id) {
                await updateService(id, payload);
            } else {
                await createService(payload);
            }
            
            navigate('/');
        } catch (error: any) {
            console.error("Submission failed:", error);
            alert(`Wystąpił błąd przy zapisywaniu: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">Wykonawca</p>
            <h1 className="mb-8 mt-2 text-4xl font-black text-[var(--color-ink)]">{id ? 'Edytuj ofertę' : 'Kreator oferty'}</h1>

            <form onSubmit={handleSubmit}>
                <Card className="mb-8 border border-[var(--color-line)] bg-white/90 p-8 shadow-sm">
                    <div className="space-y-6">
                        <Input label="Nazwa uslugi" placeholder="np. Malowanie mieszkan premium" value={title} onChange={(e) => setTitle(e.target.value)} required />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Kategoria</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/25">
                                <option value="Remonty">Remonty</option>
                                <option value="Sprzatanie">Sprzatanie</option>
                                <option value="Elektryka">Elektryka</option>
                                <option value="Ogrod">Ogrod</option>
                                <option value="IT">IT</option>
                            </select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="Cena" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Model ceny</label>
                                <select value={priceType} onChange={(e) => setPriceType(e.target.value as 'hourly' | 'fixed')} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/25">
                                    <option value="fixed">Za calosc</option>
                                    <option value="hourly">Za godzine</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="Miasta dzialania" value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Warszawa, Piaseczno, Pruszkow" />
                            <Input label="Promien dzialania (km)" type="number" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="mb-3 block text-sm font-medium text-gray-700">Dostępność</label>
                            <div className="space-y-3">
                                {availability.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Dzień (np. Pon-Pt)"
                                            className="w-1/3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)]"
                                            value={slot.dayLabel}
                                            onChange={(e) => handleAvailabilityChange(index, 'dayLabel', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Godziny (np. 08:00-16:00)"
                                            className="w-1/3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)]"
                                            value={slot.timeWindow}
                                            onChange={(e) => handleAvailabilityChange(index, 'timeWindow', e.target.value)}
                                        />
                                        <select
                                            className="w-1/4 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)]"
                                            value={slot.status}
                                            onChange={(e) => handleAvailabilityChange(index, 'status', e.target.value)}
                                        >
                                            <option value="available">Dostępny</option>
                                            <option value="busy">Zajęty / Inne</option>
                                        </select>
                                        <Button type="button" variant="ghost" onClick={() => removeAvailabilitySlot(index)} className="px-3 text-red-500 hover:bg-red-50 hover:text-red-600">
                                            Usuń
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" onClick={addAvailabilitySlot} className="text-sm">
                                    + Dodaj termin
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex flex-col gap-1.5 mb-4">
                                <label className="text-sm font-medium text-gray-700">Zdjecia oferty (opcjonalne)</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" 
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const selectedFiles = Array.from(e.target.files);
                                            setNewFiles(prev => [...prev, ...selectedFiles]);
                                            
                                            const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
                                            setPreviewUrls(prev => [...prev, ...newPreviews]);
                                            
                                            // Czyszczenie inputa, zeby mozna bylo wybrac te same pliki ponownie
                                            e.target.value = '';
                                        }
                                    }} 
                                />
                                
                                {(existingUrls.length > 0 || previewUrls.length > 0) && (
                                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                        {existingUrls.map((url, idx) => (
                                            <div key={`existing-${idx}`} className="relative overflow-hidden rounded-xl border border-[var(--color-line)] shadow-sm aspect-[4/3]">
                                                <img src={url} alt={`Zdjecie ${idx + 1}`} className="h-full w-full object-cover" />
                                                <button type="button" onClick={() => setExistingUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500 transition">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                        {previewUrls.map((url, idx) => (
                                            <div key={`new-${idx}`} className="relative overflow-hidden rounded-xl border border-[var(--color-line)] shadow-sm aspect-[4/3]">
                                                <img src={url} alt={`Nowe zdjecie ${idx + 1}`} className="h-full w-full object-cover" />
                                                <button type="button" onClick={() => {
                                                    setNewFiles(prev => prev.filter((_, i) => i !== idx));
                                                    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
                                                }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500 transition">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="mb-3 flex items-end gap-4">
                                <div className="flex-grow">
                                    <Input label="Asystent opisu oferty (Groq AI)" placeholder="Wpisz szkic opisu poniżej, a AI go ulepszy" value={description.length > 0 ? (aiCooldown > 0 ? `Ulepszone! Następne za ${aiCooldown}s` : "Gotowy do ulepszenia...") : "Wpisz coś w pole opisu..."} readOnly />
                                </div>
                                <Button type="button" variant="secondary" onClick={handleGenerateAi} isLoading={isAiLoading} disabled={!description.trim() || isAiLoading || aiCooldown > 0}>
                                    {aiCooldown > 0 ? `Poczekaj (${aiCooldown}s)` : 'Ulepsz opis AI'}
                                </Button>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Opis uslugi</label>
                                <textarea
                                    className="min-h-[200px] w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/25"
                                    placeholder="Opisz, co dokladnie robisz, za ile i na jakich warunkach."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="mb-3 block text-sm font-medium text-gray-700">Warunki współpracy</label>
                            <p className="mb-3 text-xs text-[var(--color-muted)]">Zdefiniuj zasady, na jakich realizujesz zlecenia. Możesz edytować domyślne warunki lub dodać własne.</p>
                            <div className="space-y-3">
                                {customConditions.map((condition, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="flex-grow">
                                            <Input
                                                placeholder={`Wpisz warunek współpracy...`}
                                                value={condition}
                                                onChange={(e) => handleConditionChange(index, e.target.value)}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" onClick={() => removeCondition(index)} className="mt-1 px-3 text-red-500 hover:bg-red-50 hover:text-red-600">
                                            Usuń
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" onClick={addCondition} className="text-sm">
                                    + Dodaj kolejny warunek
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Anuluj</Button>
                    <Button type="submit" isLoading={isSubmitting}>{id ? 'Zapisz zmiany' : 'Publikuj oferte'}</Button>
                </div>
            </form>
        </div>
    );
};
