import React from 'react';
import { Card, CardContent } from '../components/ui/card';

export default function StudentOffers() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Exclusive student offers.</h1>
                <p className="text-gray-500 text-lg">For MessPro users</p>
            </div>

            {/* Main Advertisement Brochure Card */}
            <Card className="overflow-hidden border-gray-200 shadow-sm max-w-2xl mx-auto hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex justify-center bg-gray-50/50">
                    <img 
                        src="/brochure.png" 
                        alt="Student Discount Brochure" 
                        className="w-full h-auto max-h-[75vh] object-contain rounded-lg shadow-sm"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
