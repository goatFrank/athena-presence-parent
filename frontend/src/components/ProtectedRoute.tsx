import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { attendanceApi } from '../api/clients';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isApproved, setIsApproved] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setIsAuthenticated(false);
                return;
            }

            setIsAuthenticated(true);

            try {
                const response = await attendanceApi.get('/api/v1/profiles/me');
                const profile = response.data.payload;
                
                if (profile && profile.tenantStatus === 'ACTIVE') {
                    setIsApproved(true);
                } else {
                    console.warn('Tenant not active:', profile?.tenantStatus);
                    setIsApproved(false);
                    // Sign out if not approved to clear session or handle it as you prefer
                    await supabase.auth.signOut();
                }
            } catch (error) {
                console.error('Error checking profile status:', error);
                setIsApproved(false);
                await supabase.auth.signOut();
            }
        };

        checkAccess();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setIsAuthenticated(false);
                setIsApproved(null);
            } else {
                setIsAuthenticated(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthenticated === null || (isAuthenticated && isApproved === null)) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium italic">Verifica autorizzazione...</p>
            </div>
        );
    }

    if (!isAuthenticated || !isApproved) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
