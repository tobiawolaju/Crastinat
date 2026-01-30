import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase-config';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(() => {
        const storedToken = localStorage.getItem('googleAccessToken');
        console.log("Auth: Initial token from storage:", storedToken ? "Exists" : "Empty");
        return storedToken;
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth: State changed. User:", user ? user.email : "Logged Out");
            setUser(user);
            setLoading(false);
            if (!user) {
                console.log("Auth: Clearing token from storage");
                setAccessToken(null);
                localStorage.removeItem('googleAccessToken');
            }
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        console.log("Auth: Starting login flow...");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                console.log("Auth: Successfully obtained Google Access Token");
                setAccessToken(token);
                localStorage.setItem('googleAccessToken', token);
            } else {
                console.warn("Auth: Login succeeded but no Access Token found in credential");
            }

            return result.user;
        } catch (error) {
            console.error("Auth: Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        console.log("Auth: Logging out...");
        return signOut(auth);
    };

    return { user, loading, accessToken, login, logout };
}
