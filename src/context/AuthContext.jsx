import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize state from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('messArgUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('messArgUser');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password, role) => {
        if (role === 'admin') {
            try {
                const { data, error } = await supabase
                    .from('admins')
                    .select('*')
                    .eq('email', username)
                    .eq('password', password) // Note: Production apps should use hashed passwords
                    .single();

                if (error || !data) {
                    return { success: false, error: 'Invalid admin credentials' };
                }

                const adminUser = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: 'admin',
                    hostelId: data.hostel_id,
                };

                setUser(adminUser);
                localStorage.setItem('messArgUser', JSON.stringify(adminUser));
                return { success: true, role: 'admin' };
            } catch (err) {
                console.error("Admin login error:", err);
                return { success: false, error: 'Admin login failed due to system error' };
            }
        }

        // Student: messNumber (case-insensitive) + phone
        // Query Supabase for student
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('mess_number', username.toUpperCase()) // stored as uppercase in DB typically, or case insensitive
                .eq('phone', password)
                .single();

            if (error || !data) {
                return { success: false, error: 'Invalid mess number or phone number' };
            }

            // Map DB to User object
            const studentUser = {
                id: data.id,
                name: data.name,
                messNumber: data.mess_number,
                phone: data.phone,
                role: 'user',
                roomNo: data.room_no,
                messStatus: data.mess_status,
                messType: data.mess_type,
                joinDate: data.join_date,
                hostelId: data.hostel_id,
            };

            setUser(studentUser);
            localStorage.setItem('messArgUser', JSON.stringify(studentUser));
            return { success: true, role: 'user' };

        } catch (err) {
            console.error("Login error:", err);
            return { success: false, error: 'Login failed due to system error' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('messArgUser');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
