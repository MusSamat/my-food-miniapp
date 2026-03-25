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

    const requestLocation = useCallback(() => {
        return new Promise((resolve) => {
            if (!tg?.LocationManager) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                        () => resolve(null),
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                } else {
                    resolve(null);
                }
                return;
            }

            tg.LocationManager.init(() => {
                if (!tg.LocationManager.isInited || !tg.LocationManager.isLocationAvailable) {
                    resolve(null);
                    return;
                }
                tg.LocationManager.getLocation((location) => {
                    if (location) {
                        resolve({ latitude: location.latitude, longitude: location.longitude });
                    } else {
                        resolve(null);
                    }
                });
            });
        });
    }, []);

    return {
        tg,
        user,
        userId: user?.id,
        username: user?.username,
        firstName: user?.first_name,
        lastName: user?.last_name,
        initData: tg?.initData || '',
        haptic,
        openLink,
        requestLocation,
        close: () => tg?.close?.(),
        ready: () => tg?.ready?.(),
        expand: () => tg?.expand?.(),
    };
};