import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ServiceCategories = () => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const categories = [
    {
      id: 1,
      name: 'Plumber',
      icon: '🔧',
      description: 'Pipe installation, repairs, and maintenance',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      popular: true
    },
    {
      id: 2,
      name: 'Electrician',
      icon: '⚡',
      description: 'Wiring, fixtures, and electrical repairs',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      popular: true
    },
    {
      id: 3,
      name: 'Carpenter',
      icon: '🪚',
      description: 'Furniture, cabinets, and woodwork',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      popular: false
    },
    {
      id: 4,
      name: 'Cleaner',
      icon: '🧹',
      description: 'House, office, and deep cleaning',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      popular: true
    },
    {
      id: 5,
      name: 'AC Repair',
      icon: '❄️',
      description: 'Cooling, heating, and maintenance',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      popular: false
    },
    {
      id: 6,
      name: 'Painter',
      icon: '🎨',
      description: 'Interior & exterior painting services',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      popular: false
    },
    {
      id: 7,
      name: 'Gardener',
      icon: '🌿',
      description: 'Lawn care, planting, and landscaping',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      popular: false
    },
    {
      id: 8,
      name: 'Mechanic',
      icon: '🔩',
      description: 'Vehicle repair and maintenance services',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      popular: false
    }
  ];

  const handleCategoryClick = (category) => {
    navigate(`/user/services?category=${category.name.toLowerCase()}`);
  };

  return (
    <div className="bg-gray-50 py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block">
            <span className="text-4xl sm:text-5xl mb-3 sm:mb-4 block">🛠️</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase park text-gray-900 mb-2 sm:mb-4">
            Service Categories
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            What can we help you with today?
          </p>
        </div>

        {/* Categories Grid - Mobile: 2 columns, Laptop: 4 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`
                relative group cursor-pointer transform transition-all duration-300
                ${hoveredCategory === category.id ? 'scale-105' : 'scale-100'}
              `}
            >
              <div className={`
                bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden
                transition-all duration-300 h-full
                ${hoveredCategory === category.id ? 'shadow-xl' : 'shadow-md'}
              `}>
                {/* Popular Badge */}
                {category.popular && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                    <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                      🔥 Popular
                    </span>
                  </div>
                )}

                <div className="p-3 sm:p-4 md:p-6">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full 
                    flex items-center justify-center mb-2 sm:mb-3 md:mb-4 mx-auto
                    transition-all duration-300
                    ${category.bgColor}
                    ${hoveredCategory === category.id ? 'scale-110' : 'scale-100'}
                  `}>
                    <span className="text-2xl sm:text-3xl md:text-4xl">{category.icon}</span>
                  </div>

                  {/* Title */}
                  <h3 className={`
                    text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 text-center 
                    transition-colors duration-300
                    ${category.textColor}
                  `}>
                    {category.name}
                  </h3>

                  {/* Description - Hide on mobile, show on tablet and up */}
                  <p className="hidden sm:block text-gray-600 text-xs md:text-sm text-center mb-2 sm:mb-3 md:mb-4">
                    {category.description}
                  </p>

                  {/* Book Now Link */}
                  <div className={`
                    flex items-center justify-center text-xs sm:text-sm font-medium
                    ${category.textColor}
                    transition-all duration-300
                    ${hoveredCategory === category.id ? 'translate-x-0.5 sm:translate-x-1' : 'translate-x-0'}
                  `}>
                    <span>Book Now</span>
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform duration-300"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ transform: hoveredCategory === category.id ? 'translateX(4px)' : 'translateX(0)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Hover Gradient Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-r ${category.color} opacity-0
                  transition-opacity duration-300 rounded-lg sm:rounded-xl pointer-events-none
                  ${hoveredCategory === category.id ? 'opacity-5' : 'opacity-0'}
                `} />
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/user/services')}
            className="group inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            <span>View all services</span>
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategories;