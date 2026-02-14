import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const LeaveContext = createContext(null);

export function LeaveProvider({ children }) {
    const [leaves, setLeaves] = useState({});
    const { user } = useAuth();

    useEffect(() => {
        if (user?.hostelId) {
            fetchLeaves();

            const subscription = supabase
                .channel('leaves-channel')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'leaves',
                        filter: `hostel_id=eq.${user.hostelId}`
                    },
                    () => {
                        fetchLeaves();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        } else {
            setLeaves({});
        }
    }, [user?.hostelId]);

    const fetchLeaves = async () => {
        if (!user?.hostelId) return;

        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('status', 'Approved')
            .eq('hostel_id', user.hostelId);

        if (error) {
            console.error('Error fetching leaves:', error);
            return;
        }

        // Transform [ { date: 'Y-M-D', mess_number: '...' } ] -> { 'Y-M-D': ['MESS-1'] }
        const leavesMap = {};
        data.forEach(record => {
            const d = record.leave_date; // YYYY-MM-DD
            if (!leavesMap[d]) leavesMap[d] = [];
            // ENSURE UNIQUENESS: Only push if not already present
            if (!leavesMap[d].includes(record.mess_number)) {
                leavesMap[d].push(record.mess_number);
            }
        });
        setLeaves(leavesMap);
    };

    const getLeavesByDate = (date) => {
        return leaves[date] || [];
    };

    const isStudentOnLeave = (messNumber, date) => {
        const shapeDate = date.includes('T') ? date.split('T')[0] : date;
        return leaves[shapeDate]?.includes(messNumber);
    };

    const addLeave = async (messNumber, date, studentId) => {
        if (!user?.hostelId) return { success: false, error: 'No hostel assigned' };
        const shapeDate = date.includes('T') ? date.split('T')[0] : date;

        // CHECK IF ALREADY EXISTS (Local Check)
        if (leaves[shapeDate]?.includes(messNumber)) {
            return { success: true, alreadyExists: true };
        }

        // Optimistic update
        setLeaves(prev => {
            const current = prev[shapeDate] || [];
            if (current.includes(messNumber)) return prev;
            return { ...prev, [shapeDate]: [...current, messNumber] };
        });

        let sid = studentId;
        if (!sid) {
            const { data } = await supabase
                .from('students')
                .select('id')
                .eq('mess_number', messNumber)
                .eq('hostel_id', user.hostelId)
                .single();
            if (data) sid = data.id;
        }

        // Double check in DB to be strictly sure
        const { data: existing } = await supabase
            .from('leaves')
            .select('id')
            .eq('mess_number', messNumber)
            .eq('leave_date', shapeDate)
            .eq('hostel_id', user.hostelId)
            .maybeSingle();

        if (existing) {
            return { success: true, alreadyExists: true };
        }

        const { error } = await supabase.from('leaves').insert([{
            student_id: sid,
            mess_number: messNumber,
            leave_date: shapeDate,
            status: 'Approved',
            hostel_id: user.hostelId
        }]);

        if (error) {
            console.error('Error adding leave:', error);
            // Revert optimistic update
            fetchLeaves();
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const removeLeave = async (messNumber, date) => {
        if (!user?.hostelId) return { success: false, error: 'No hostel assigned' };
        const shapeDate = date.includes('T') ? date.split('T')[0] : date;

        setLeaves(prev => {
            const current = prev[shapeDate] || [];
            return { ...prev, [shapeDate]: current.filter(id => id !== messNumber) };
        });

        const { error } = await supabase
            .from('leaves')
            .delete()
            .eq('mess_number', messNumber)
            .eq('leave_date', shapeDate)
            .eq('hostel_id', user.hostelId);

        if (error) {
            console.error('Error removing leave:', error);
            fetchLeaves();
            return { success: false, error: error.message };
        }

        return { success: true };
    };

    return (
        <LeaveContext.Provider value={{ leaves, getLeavesByDate, addLeave, removeLeave, isStudentOnLeave }}>
            {children}
        </LeaveContext.Provider>
    );
}

export function useLeaves() {
    const ctx = useContext(LeaveContext);
    if (!ctx) throw new Error('useLeaves must be used within a LeaveProvider');
    return ctx;
}
