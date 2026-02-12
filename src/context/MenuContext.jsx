import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
    const [weeklyMenu, setWeeklyMenu] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMenu();

        const subscription = supabase
            .channel('menu-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'weekly_menu' },
                () => {
                    fetchMenu();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchMenu = async () => {
        try {
            const { data, error } = await supabase
                .from('weekly_menu')
                .select('*');

            if (error) throw error;

            // Transform array [{ day_of_week: 'Monday', ... }] to object { 'Monday': { ... } }
            const menuMap = {};
            data.forEach(item => {
                menuMap[item.day_of_week] = {
                    breakfast: item.breakfast || [],
                    lunch: item.lunch || [],
                    snack: item.snack || [],
                    dinner: item.dinner || []
                };
            });
            setWeeklyMenu(menuMap);
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateDayMenu = async (day, mealType, newItems) => {
        // Optimistic update
        setWeeklyMenu(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [mealType]: newItems
            }
        }));

        // DB Update
        // We need to update the specific column for the specific day row
        const { error } = await supabase
            .from('weekly_menu')
            .update({ [mealType]: newItems })
            .eq('day_of_week', day);

        if (error) {
            console.error('Error updating menu:', error);
            // Revert would go here in robust app
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    return (
        <MenuContext.Provider value={{ weeklyMenu, updateDayMenu, loading }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const ctx = useContext(MenuContext);
    if (!ctx) throw new Error('useMenu must be used within a MenuProvider');
    return ctx;
}
