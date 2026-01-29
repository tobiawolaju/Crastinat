import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase-config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('googleAccessToken'));

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            if (!user) {
                setAccessToken(null);
                localStorage.removeItem('googleAccessToken');
            }
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = result.credential.accessToken;
            setAccessToken(token);
            localStorage.setItem('googleAccessToken', token);
            return result.user;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => signOut(auth);

    return { user, loading, accessToken, login, logout };
}
