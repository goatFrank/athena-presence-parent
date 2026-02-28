import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Funzione per controllare la sessione attuale
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };

        checkSession();

        // Iscrizione ai cambiamenti di stato dell'autenticazione (login/logout/scadenza token)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        // Pulizia listener
        return () => subscription.unsubscribe();
    }, []);

    // Mostra uno stato di caricamento finché non recuperiamo la sessione (evita redirect improvvisi se loggato)
    if (isAuthenticated === null) {
        return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
