import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Default Fallback Values ────────────────────────────────────────────────
const DEFAULT_USER = {
    fullName: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    location: 'Karnal, Haryana',
    farmSize: '12 Acres',
    profileImage:
        'https://images.unsplash.com/photo-1506869640319-ce1a44a1eb6f?auto=format&fit=crop&q=80&w=200&h=200',
};

// ─── Load from localStorage (called once on init) ───────────────────────────
function loadUserFromStorage() {
    try {
        const savedProfile = localStorage.getItem('userProfile');
        const savedImage = localStorage.getItem('profileImage');

        const profile = savedProfile ? JSON.parse(savedProfile) : {};
        const profileImage = savedImage || DEFAULT_USER.profileImage;

        return {
            fullName: profile.fullName || DEFAULT_USER.fullName,
            phone: profile.phone || DEFAULT_USER.phone,
            location: profile.location || DEFAULT_USER.location,
            farmSize: profile.farmSize || DEFAULT_USER.farmSize,
            profileImage,
        };
    } catch {
        return { ...DEFAULT_USER };
    }
}

// ─── Context ─────────────────────────────────────────────────────────────────
export const UserContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function UserProvider({ children }) {
    const [user, setUser] = useState(() => loadUserFromStorage());

    /**
     * updateUser – merge partial fields into user state AND persist to localStorage.
     * Usage: updateUser({ fullName: 'New Name' })
     */
    const updateUser = useCallback((fields) => {
        setUser((prev) => {
            const next = { ...prev, ...fields };

            // Persist the profile fields (exclude profileImage – stored separately)
            const { profileImage, ...profileFields } = next;
            localStorage.setItem('userProfile', JSON.stringify(profileFields));

            // Persist image separately (can be a large base64 string)
            if ('profileImage' in fields) {
                localStorage.setItem('profileImage', profileImage);
            }

            return next;
        });
    }, []);

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

// ─── Custom Hook ──────────────────────────────────────────────────────────────
// Makes consuming the context clean and beginner-friendly:
//   const { user, updateUser } = useUser();
export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error('useUser must be used inside a <UserProvider>');
    }
    return ctx;
}
