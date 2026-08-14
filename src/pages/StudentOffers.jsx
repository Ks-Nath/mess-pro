import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentOffers() {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    // When the second image is ready, replace the placeholder object with an image object
    const slides = [
        { id: 1, type: 'image', src: '/brochure.png', alt: 'Student Discount Brochure' },
        { id: 2, type: 'placeholder', text: 'More offers coming soon!' }
    ];

    const scrollTo = (index) => {
        if (!scrollContainerRef.current) return;
        
        const container = scrollContainerRef.current;
        const slideWidth = container.clientWidth;
        container.scrollTo({
            left: index * slideWidth,
            behavior: 'smooth'
        });
        setActiveIndex(index);
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollPosition = container.scrollLeft;
        const slideWidth = container.clientWidth;
        // Calculate the current active slide index based on scroll position
        const newIndex = Math.round(scrollPosition / slideWidth);
        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }
    };

    const nextSlide = () => {
        if (activeIndex < slides.length - 1) {
            scrollTo(activeIndex + 1);
        }
    };

    const prevSlide = () => {
        if (activeIndex > 0) {
            scrollTo(activeIndex - 1);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Exclusive student offers.</h1>
                <p className="text-gray-500 text-lg">For MessPro users</p>
            </div>

            {/* Slider Container */}
            <div className="relative max-w-2xl mx-auto group">
                <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50/50">
                    <CardContent className="p-0 relative">
                        {/* Scroll Area */}
                        <div 
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {slides.map((slide) => (
                                <div 
                                    key={slide.id} 
                                    className="flex-none w-full snap-center p-4 flex justify-center items-center min-h-[50vh] max-h-[75vh]"
                                >
                                    {slide.type === 'image' ? (
                                        <img 
                                            src={slide.src} 
                                            alt={slide.alt} 
                                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                            <p className="text-gray-400 font-medium">{slide.text}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons (visible on hover on desktop) */}
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden sm:flex">
                            <button 
                                onClick={prevSlide}
                                disabled={activeIndex === 0}
                                className="p-2 rounded-full bg-white/80 backdrop-blur shadow-md text-gray-800 hover:bg-white disabled:hidden transition-transform active:scale-95"
                                aria-label="Previous offer"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hidden sm:flex">
                            <button 
                                onClick={nextSlide}
                                disabled={activeIndex === slides.length - 1}
                                className="p-2 rounded-full bg-white/80 backdrop-blur shadow-md text-gray-800 hover:bg-white disabled:hidden transition-transform active:scale-95"
                                aria-label="Next offer"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                activeIndex === index ? 'bg-indigo-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
            
            {/* Global style to hide scrollbar for webkit (Chrome/Safari) */}
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div>
    );
}
