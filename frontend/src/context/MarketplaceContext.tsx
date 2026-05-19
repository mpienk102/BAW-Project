import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface Review {
    id: string;
    author: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    author: 'client' | 'provider';
    text: string;
    isRead: boolean;
    sentAt: string;
}

export interface AvailabilitySlot {
    day: string;
    window: string;
    status: 'available' | 'busy';
}

export interface ServiceListing {
    id: string;
    title: string;
    category: string;
    description: string;
    priceType: 'hourly' | 'fixed';
    price: number;
    locationLabel: string;
    cities: string[];
    radiusKm: number;
    turnaround: string;
    responseTime: string;
    rating: number;
    reviewCount: number;
    completedJobs: number;
    provider: {
        name: string;
        company: string;
        bio: string;
        verifiedLabel: string;
    };
    highlights: string[];
    conditions: string[];
    portfolio: string[];
    reviews: Review[];
    availability: AvailabilitySlot[];
    customConditions: string[];
}

export interface Inquiry {
    id: string;
    serviceId: string;
    serviceTitle: string;
    status: 'Nowe' | 'W trakcie' | 'Umowione' | 'Zamkniete';
    budget: string;
    preferredDate: string;
    customerName: string;
    summary: string;
    location: string;
    messages: ChatMessage[];
}

interface CreateServiceInput {
    title: string;
    category: string;
    description: string;
    price: number;
    priceType: 'hourly' | 'fixed';
    radiusKm: number;
    cities: string[];
    photoUrls?: string[];
    availability: { dayLabel: string; timeWindow: string; status: 'available' | 'busy' }[];
    customConditions: string[];
}

interface MarketplaceContextType {
    services: ServiceListing[];
    myServices: ServiceListing[];
    clientInquiries: Inquiry[];
    providerInquiries: Inquiry[];
    isLoading: boolean;
    uploadImage: (file: File) => Promise<string>;
    createService: (input: CreateServiceInput) => Promise<void>;
    updateService: (id: string, input: CreateServiceInput) => Promise<void>;
    sendInquiry: (serviceId: string, payload: { brief: string; budget: string; preferredDate: string; customerName: string; location: string; }) => Promise<void>;
    replyToInquiry: (inquiryId: string, text: string) => Promise<void>;
    closeInquiry: (inquiryId: string) => Promise<void>;
    markInquiryAsRead: (inquiryId: string) => Promise<void>;
    addReview: (serviceId: string, rating: number, comment: string) => Promise<void>;
    resetDemo: () => Promise<void>;
    findServiceById: (id: string) => ServiceListing | undefined;
    refreshAll: () => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

const mapService = (raw: any): ServiceListing => ({
    id: raw.id,
    title: raw.title,
    category: raw.category?.name ?? raw.category ?? 'Bez kategorii',
    description: raw.description,
    priceType: raw.priceType === 'hourly' ? 'hourly' : 'fixed',
    price: Number(raw.price ?? 0),
    locationLabel: raw.locationLabel ?? '',
    cities: raw.cities ?? [],
    radiusKm: raw.radiusKm ?? 0,
    turnaround: raw.turnaround ?? 'Na zapytanie',
    responseTime: raw.responseTime ?? `< ${raw.responseTimeMinutes ?? 60} min`,
    rating: Number(raw.rating ?? 0),
    reviewCount: raw.reviewCount ?? 0,
    completedJobs: raw.completedJobs ?? 0,
    provider: {
        name: raw.provider?.name ?? `${raw.provider?.firstName ?? ''} ${raw.provider?.lastName ?? ''}`.trim(),
        company: raw.provider?.company ?? raw.provider?.companyName ?? 'Wykonawca',
        bio: raw.provider?.bio ?? '',
        verifiedLabel: raw.provider?.verifiedLabel ?? 'Aktywny wykonawca'
    },
    highlights: raw.highlights ?? ['Zdjecia portfolio', 'Szybki kontakt', 'Przejrzyste warunki'],
    conditions: raw.customConditions ?? raw.conditions ?? [],
    portfolio: (raw.portfolio ?? raw.photoUrls ?? []).map((item: any) => typeof item === 'string' ? item : item.photoUrl),
    reviews: (raw.reviews ?? []).map((review: any) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
    })),
    availability: (raw.availability ?? []).map((slot: any) => ({
        day: slot.dayLabel,
        window: slot.timeWindow,
        status: slot.status === 'available' ? 'available' : 'busy'
    })),
    customConditions: raw.customConditions ?? raw.conditions ?? []
});

const mapInquiry = (raw: any): Inquiry => ({
    id: raw.id,
    serviceId: raw.serviceId,
    serviceTitle: raw.serviceTitle,
    status: raw.status,
    budget: raw.budget,
    preferredDate: raw.preferredDate,
    customerName: raw.customerName,
    summary: raw.summary,
    location: raw.location,
    messages: (raw.messages ?? []).map((message: any) => ({
        id: message.id,
        author: message.senderRole === 'provider' ? 'provider' : 'client',
        text: message.text,
        isRead: message.isRead ?? true,
        sentAt: new Date(message.sentAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    }))
});

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [services, setServices] = useState<ServiceListing[]>([]);
    const [myServices, setMyServices] = useState<ServiceListing[]>([]);
    const [clientInquiries, setClientInquiries] = useState<Inquiry[]>([]);
    const [providerInquiries, setProviderInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAll = async () => {
        setIsLoading(true);
        try {
            if (!isAuthenticated) {
                // Gość: tylko publiczna lista usług, bez endpointów wymagających JWT
                const servicesRes = await api.get('/services');
                setServices(servicesRes.data.map(mapService));
                setMyServices([]);
                setClientInquiries([]);
                setProviderInquiries([]);
            } else {
                // Zalogowany: pełny zestaw danych
                const [servicesRes, myServicesRes, clientInquiriesRes, providerInquiriesRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/services/my'),
                    api.get('/inquiries/client'),
                    api.get('/inquiries/provider')
                ]);

                setServices(servicesRes.data.map(mapService));
                setMyServices(myServicesRes.data.map(mapService));
                setClientInquiries(clientInquiriesRes.data.map(mapInquiry));
                setProviderInquiries(providerInquiriesRes.data.map(mapInquiry));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void refreshAll();
    }, [isAuthenticated]);

    const createService = async (input: CreateServiceInput) => {
        await api.post('/services', {
            categoryName: input.category,
            title: input.title,
            description: input.description,
            basePrice: input.price,
            priceType: input.priceType,
            locationLabel: input.cities[0] ? `${input.cities[0]} i okolice` : 'Nowy obszar',
            cities: input.cities,
            radiusKm: input.radiusKm,
            turnaround: 'Nowa oferta',
            responseTimeMinutes: 60,
            requiresReservation: false,
            photoUrls: input.photoUrls && input.photoUrls.length > 0 ? input.photoUrls : ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'],
            availability: input.availability,
            customConditions: input.customConditions
        });

        await refreshAll();
    };

    const updateService = async (id: string, input: CreateServiceInput) => {
        const existingService = services.find((item) => item.id === id);
        const currentPhotos = existingService ? existingService.portfolio : [];

        await api.put(`/services/${id}`, {
            categoryName: input.category,
            title: input.title,
            description: input.description,
            basePrice: input.price,
            priceType: input.priceType,
            locationLabel: input.cities[0] ? `${input.cities[0]} i okolice` : 'Nowy obszar',
            cities: input.cities,
            radiusKm: input.radiusKm,
            turnaround: existingService?.turnaround || 'Na zapytanie',
            responseTimeMinutes: 60,
            requiresReservation: false,
            photoUrls: input.photoUrls && input.photoUrls.length > 0 ? input.photoUrls : currentPhotos,
            availability: input.availability,
            customConditions: input.customConditions,
            isActive: true
        });

        await refreshAll();
    };

    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/uploads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.url;
    };

    const sendInquiry = async (serviceId: string, payload: { brief: string; budget: string; preferredDate: string; customerName: string; location: string; }) => {
        await api.post('/inquiries', {
            serviceId,
            budget: payload.budget,
            preferredDate: payload.preferredDate,
            summary: payload.brief,
            location: payload.location
        });

        await refreshAll();
    };

    const replyToInquiry = async (inquiryId: string, text: string) => {
        await api.post(`/inquiries/${inquiryId}/messages`, { text });
        await refreshAll();
    };

    const closeInquiry = async (inquiryId: string) => {
        await api.patch(`/inquiries/${inquiryId}/status`, { status: 'Zamkniete' });
        await refreshAll();
    };

    const markInquiryAsRead = async (inquiryId: string) => {
        await api.patch(`/inquiries/${inquiryId}/read`);
        await refreshAll();
    };

    const addReview = async (serviceId: string, rating: number, comment: string) => {
        await api.post(`/services/${serviceId}/reviews`, { rating, comment });
        await refreshAll();
    };

    const resetDemo = async () => {
        await api.post('/demo/reset');
        await refreshAll();
    };

    const value = useMemo(
        () => ({
            services,
            myServices,
            clientInquiries,
            providerInquiries,
            isLoading,
            uploadImage,
            createService,
            updateService,
            sendInquiry,
            replyToInquiry,
            closeInquiry,
            markInquiryAsRead,
            addReview,
            resetDemo,
            findServiceById: (id: string) => services.find((item) => item.id === id),
            refreshAll
        }),
        [services, myServices, clientInquiries, providerInquiries, isLoading]
    );

    return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
};

export const useMarketplace = () => {
    const context = useContext(MarketplaceContext);
    if (!context) {
        throw new Error('useMarketplace must be used within MarketplaceProvider');
    }

    return context;
};
