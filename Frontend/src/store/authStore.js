import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      updateUser: (user) =>
        set((state) => ({
          user: { ...state.user, ...user },
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      isRole: (role) => {
        const state = useAuthStore.getState();
        return state.user?.role === role;
      },

      hasAnyRole: (...roles) => {
        const state = useAuthStore.getState();
        return roles.includes(state.user?.role);
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);

export default useAuthStore;
