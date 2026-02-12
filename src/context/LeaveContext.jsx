import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const LeaveContext = createContext(null);

export function LeaveProvider({ children }) {
    const [leaves, setLeaves] = useState({});

    useEffect(() => {
        fetchLeaves();

        const subscription = supabase
            .channel('leaves-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leaves' },
                () => {
                    // Refresh all leaves on any change for simplicity (or handle granularly)
                    fetchLeaves();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchLeaves = async () => {
        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('status', 'Approved');

        if (error) {
            console.error('Error fetching leaves:', error);
            return;
        }

        // Transform [ { date: 'Y-M-D', mess_number: '...' } ] -> { 'Y-M-D': ['MESS-1'] }
        const leavesMap = {};
        data.forEach(record => {
            const d = record.leave_date; // YYYY-MM-DD
            if (!leavesMap[d]) leavesMap[d] = [];
            leavesMap[d].push(record.mess_number);
        });
        setLeaves(leavesMap);
    };

    const getLeavesByDate = (date) => {
        return leaves[date] || [];
    };

    const isStudentOnLeave = (messNumber, date) => {
        // date arg might be full ISO or just YYYY-MM-DD. Normalize to YYYY-MM-DD
        const shapeDate = date.includes('T') ? date.split('T')[0] : date;
        return leaves[shapeDate]?.includes(messNumber);
    };

    const addLeave = async (messNumber, date, studentId) => {
        const shapeDate = date.includes('T') ? date.split('T')[0] : date;

        // Optimistic update
        setLeaves(prev => {
            const current = prev[shapeDate] || [];
            if (current.includes(messNumber)) return prev;
            return { ...prev, [shapeDate]: [...current, messNumber] };
        });

        // If studentId is not passed (legacy calls), we need to fetch it or rely on triggering from a context that has it.
        // For now, let's assume valid calls pass studentId or we look it up (expensive).
        // Since we are adding DB integration, let's require studentId or fetch it efficiently.
        // Fallback: look up student ID by messNumber if not provided
        let sid = studentId;
        if (!sid) {
            const { data } = await supabase.from('students').select('id').eq('mess_number', messNumber).single();
            if (data) sid = data.id;
        }

        const { error } = await supabase.from('leaves').insert([{
            student_id: sid,
            mess_number: messNumber,
            leave_date: shapeDate,
            status: 'Approved'
        }]);

        if (error) {
            console.error('Error adding leave:', error);
            // Revert optimistic update? For now, we'll let the realtime subscription fix it or simple error fetch.
            // A production app would revert the state here.
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const removeLeave = async (messNumber, date) => {
        const shapeDate = date.includes('T') ? date.split('T')[0] : date;

        setLeaves(prev => {
            const current = prev[shapeDate] || [];
            return { ...prev, [shapeDate]: current.filter(id => id !== messNumber) };
        });

        const { error } = await supabase
            .from('leaves')
            .delete()
            .eq('mess_number', messNumber)
            .eq('leave_date', shapeDate);

        if (error) {
            console.error('Error removing leave:', error);
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
