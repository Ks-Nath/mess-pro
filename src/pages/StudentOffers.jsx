import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { ChevronDown, Tag } from 'lucide-react';

export default function StudentOffers() {
    const [offersOpen, setOffersOpen] = useState(true);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Exclusive student offers.</h1>
                <p className="text-gray-500 text-lg">For MessPro users</p>
            </div>

            {/* Cards Container */}
            <div className="space-y-5 max-w-2xl mx-auto">
                {/* Offers Card */}
                <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <button
                        onClick={() => setOffersOpen(!offersOpen)}
                        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-gray-50/60 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-sm">
                                <Tag className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Offers</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Browse advertisements &amp; brochures</p>
                            </div>
                        </div>
                        <ChevronDown
                            className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${offersOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    <div
                        className={`transition-all duration-400 ease-in-out overflow-hidden ${offersOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="border-t border-gray-100 p-6 sm:p-8">
                            <div className="w-full min-h-[220px] flex flex-col items-center justify-center bg-gray-50/70 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                                    <Tag className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Coming Soon</h3>
                                <p className="text-sm text-gray-500 max-w-sm mt-1">
                                    New exclusive offers and discounts will be available soon. Check back later!
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
