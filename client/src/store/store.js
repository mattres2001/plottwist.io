import { create } from 'zustand'

export const store = create((set) => ({

    // Session state
    session: {
        code: null,
        hostId: null,
        players: [],
        status: 'idle' // idle | waiting | active | ended
    },

    setSession: (sessionData) => set(() => ({
        session: {
            code: sessionData.code ?? null,
            hostId: sessionData.hostId ?? null,
            players: sessionData.players ?? [],
            status: sessionData.status ?? 'waiting'
        }
    })),

    addPlayer: (player) => set((state) => ({
        session: {
            ...state.session,
            players: [...state.session.players, player]
        }
    })),

    removePlayer: (playerId) => set((state) => ({
        session: {
            ...state.session,
            players: state.session.players.filter(p => p !== playerId)
        }
    })),

    setStatus: (status) => set((state) => ({
        session: {
            ...state.session,
            status
        }
    })),

    clearSession: () => set(() => ({
        session: {
            code: null,
            hostId: null,
            players: [],
            status: 'idle'
        }
    }))

}))