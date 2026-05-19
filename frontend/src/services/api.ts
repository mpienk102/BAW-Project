import axios from 'axios';

const api = axios.create({
    baseURL: 'https://baw-project.onrender.com/api', // Assumes ASP.NET Core API running on port 5000
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Hardening: if any caller accidentally passes an auth/session token in the URL/query,
    // move it to the Authorization header to avoid leaking it via logs, referrers, caches, etc.
    if (config.headers) {
        const paramContainer = (config.params ?? {}) as Record<string, unknown>;
        const tokenFromParams =
            (typeof paramContainer.sessionToken === 'string' && paramContainer.sessionToken) ||
            (typeof paramContainer.authToken === 'string' && paramContainer.authToken) ||
            (typeof paramContainer.access_token === 'string' && paramContainer.access_token) ||
            (typeof paramContainer.jwt === 'string' && paramContainer.jwt);

        if (!token && tokenFromParams) {
            config.headers.Authorization = `Bearer ${tokenFromParams}`;
        }

        if (paramContainer.sessionToken) delete paramContainer.sessionToken;
        if (paramContainer.authToken) delete paramContainer.authToken;
        if (paramContainer.access_token) delete paramContainer.access_token;
        if (paramContainer.jwt) delete paramContainer.jwt;

        if (config.params) config.params = paramContainer;

        if (typeof config.url === 'string' && /[?&](sessionToken|authToken|access_token|jwt)=/i.test(config.url)) {
            try {
                const resolved = new URL(config.url, config.baseURL ?? window.location.origin);
                const urlToken =
                    resolved.searchParams.get('sessionToken') ||
                    resolved.searchParams.get('authToken') ||
                    resolved.searchParams.get('access_token') ||
                    resolved.searchParams.get('jwt');

                if (!token && urlToken) {
                    config.headers.Authorization = `Bearer ${urlToken}`;
                }

                resolved.searchParams.delete('sessionToken');
                resolved.searchParams.delete('authToken');
                resolved.searchParams.delete('access_token');
                resolved.searchParams.delete('jwt');

                config.url = resolved.pathname + resolved.search + resolved.hash;
            } catch {
                // ignore malformed URL; axios will handle the request error if any
            }
        }
    }
    return config;
}, error => Promise.reject(error));

export default api;
