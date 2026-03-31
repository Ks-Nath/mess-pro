import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useStudents } from '../context/StudentContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CalendarRange, Search, Users } from 'lucide-react';

export default function LeaveTillJoinList() {
    const { user } = useAuth();
    const { students } = useStudents();
    const [ltjRecords, setLtjRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user?.hostelId) {
            fetchLeaveTillJoinRecords();
        }
    }, [user?.hostelId]);

    const fetchLeaveTillJoinRecords = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        try {
            // Only fetch admin-granted leaves where today is included in the range.
            // We do this by fetching all LTJ records for today specifically.
            const PAGE_SIZE = 1000;
            let allData = [];
            let from = 0;
            let keepFetching = true;

            while (keepFetching) {
                const { data, error } = await supabase
                    .from('leaves')
                    .select('mess_number, leave_date')
                    .eq('hostel_id', user.hostelId)
                    .eq('status', 'Approved')
                    .eq('is_admin_granted', true)
                    .eq('leave_date', today)          // ← only today's records
                    .range(from, from + PAGE_SIZE - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = allData.concat(data);
                }

                if (!data || data.length < PAGE_SIZE) {
                    keepFetching = false;
                } else {
                    from += PAGE_SIZE;
                }
            }

            // Each row here is a student on LTJ today.
            // Now fetch their full range (earliest & latest LTJ date) separately so we can show "from → to".
            const messNumbers = [...new Set(allData.map(r => r.mess_number))];

            let rangeData = [];
            if (messNumbers.length > 0) {
                // Fetch all LTJ leaves for these students to determine original range
                const PAGE_SIZE2 = 1000;
                let from2 = 0;
                let keepFetching2 = true;
                while (keepFetching2) {
                    const { data: rd, error: re } = await supabase
                        .from('leaves')
                        .select('mess_number, leave_date')
                        .eq('hostel_id', user.hostelId)
                        .eq('status', 'Approved')
                        .eq('is_admin_granted', true)
                        .in('mess_number', messNumbers)
                        .order('leave_date', { ascending: true })
                        .range(from2, from2 + PAGE_SIZE2 - 1);

                    if (re) throw re;
                    if (rd && rd.length > 0) rangeData = rangeData.concat(rd);
                    if (!rd || rd.length < PAGE_SIZE2) keepFetching2 = false;
                    else from2 += PAGE_SIZE2;
                }
            }

            // Group to get min/max date per student
            const grouped = {};
            rangeData.forEach(record => {
                const mn = record.mess_number;
                if (!grouped[mn]) {
                    grouped[mn] = { fromDate: record.leave_date, toDate: record.leave_date };
                } else {
                    if (record.leave_date < grouped[mn].fromDate) grouped[mn].fromDate = record.leave_date;
                    if (record.leave_date > grouped[mn].toDate) grouped[mn].toDate = record.leave_date;
                }
            });

            // Only include students who are on leave today
            const list = messNumbers.map(mn => ({
                messNumber: mn,
                fromDate: grouped[mn]?.fromDate ?? today,
                toDate: grouped[mn]?.toDate ?? today,
            }));

            list.sort((a, b) =>
                a.messNumber.localeCompare(b.messNumber, undefined, { numeric: true, sensitivity: 'base' })
            );

            setLtjRecords(list);
        } catch (err) {
            console.error('Error fetching Leave Till Join records:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const filteredRecords = ltjRecords.filter(record => {
        const student = students.find(s => s.messNumber === record.messNumber);
        const name = student ? student.name.toLowerCase() : '';
        const q = search.toLowerCase();
        return record.messNumber.includes(q) || name.includes(q);
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Leave Till Join List</h1>
                    <p className="text-gray-500 mt-1">
                        Students on Leave Till Join <strong>today</strong> — their full leave range is shown below.
                    </p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-sm px-3 py-1">
                    <Users className="w-4 h-4 mr-1.5 inline" />
                    {filteredRecords.length} {filteredRecords.length === 1 ? 'student' : 'students'}
                </Badge>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 max-w-sm border border-gray-300 rounded-md bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search by name or mess no..."
                    className="flex-1 text-sm bg-transparent outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-amber-500" />
                        Active Leave Till Join Records
                    </CardTitle>
                    <CardDescription>
                        Showing students whose Leave Till Join includes <strong>today</strong>. The From/To columns show their full leave range.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-16 text-gray-400">
                            <CalendarRange className="w-12 h-12 mx-auto mb-3 opacity-20 animate-pulse" />
                            <p>Loading records...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <CalendarRange className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">
                                {search ? 'No students match your search.' : 'No Leave Till Join records found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-700 w-28">Mess No</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">From</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700">To</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700 hidden md:table-cell text-center">Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRecords.map(record => {
                                        const student = students.find(s => s.messNumber === record.messNumber);
                                        const name = student ? student.name : 'Unknown';

                                        const from = new Date(record.fromDate);
                                        const to = new Date(record.toDate);
                                        const days = Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1;

                                        return (
                                            <tr key={record.messNumber} className="hover:bg-amber-50 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-amber-700">
                                                    {record.messNumber}
                                                </td>
                                                <td className="px-4 py-3 text-gray-800">{name}</td>
                                                <td className="px-4 py-3 text-gray-600">{formatDate(record.fromDate)}</td>
                                                <td className="px-4 py-3 text-gray-600">{formatDate(record.toDate)}</td>
                                                <td className="px-4 py-3 hidden md:table-cell text-center">
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                        {days}d
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
