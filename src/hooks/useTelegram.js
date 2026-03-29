import { useMemo, useCallback } from 'react';

const tg = window.Telegram?.WebApp;

export const useTelegram = () => {
    const user = useMemo(() => tg?.initDataUnsafe?.user || null, []);

    const haptic = useCallback((type = 'impact') => {
        if (!tg?.HapticFeedback) return;
        if (type === 'impact') tg.HapticFeedback.impactOccurred('light');
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
    }, []);

    const openLink = useCallback((url) => {
        if (tg?.openLink) tg.openLink(url);
        else window.open(url, '_blank');
    }, []);

    // Fast geolocation — try multiple sources with race
    const requestLocation = useCallback(() => {
        return new Promise((resolve) => {
            let resolved = false;
            const done = (result) => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };

            // Timeout — 5 seconds max
            setTimeout(() => done(null), 5000);

            // Source 1: Telegram LocationManager (fastest in Telegram)
            if (tg?.LocationManager) {
                tg.LocationManager.init(() => {
                    if (tg.LocationManager.isInited && tg.LocationManager.isLocationAvailable) {
                        tg.LocationManager.getLocation((loc) => {
                            if (loc) done({ latitude: loc.latitude, longitude: loc.longitude });
                        });
                    }
                });
            }

            // Source 2: Browser geolocation (parallel, low accuracy first for speed)
            if (navigator.geolocation) {
                // Fast: low accuracy
                navigator.geolocation.getCurrentPosition(
                    (pos) => done({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                    () => {},
                    { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
                );

                // Precise: high accuracy (if fast one hasn't resolved yet)
                navigator.geolocation.getCurrentPosition(
                    (pos) => done({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                    () => {},
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            }
        });
    }, []);

    return {
        tg, user,
        userId: user?.id,
        username: user?.username,
        firstName: user?.first_name,
        lastName: user?.last_name,
        initData: tg?.initData || '',
        haptic, openLink, requestLocation,
        close: () => tg?.close?.(),
        ready: () => tg?.ready?.(),
        expand: () => tg?.expand?.(),
    };
};