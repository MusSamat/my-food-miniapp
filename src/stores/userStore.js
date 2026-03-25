import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
    persist(
        (set, get) => ({
            user: null,
            loaded: false,

            setUser: (data) => set({ user: data, loaded: true }),

            updateUser: (fields) => set((state) => ({
                user: state.user ? { ...state.user, ...fields } : fields,
            })),

            getPhone: () => get().user?.phone || '',
            getName: () => {
                const u = get().user;
                return u?.first_name || u?.username || '';
            },
            getSavedAddress: () => get().user?.saved_address || '',
            getSavedOfficeId: () => get().user?.saved_office_id || '',
        }),
        {
            name: 'food-user',
            partialize: (state) => ({ user: state.user }),
        }
    )
);

export default useUserStore;