import React, { useState } from 'react';

const FeaturesSection = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      id: 1,
      title: 'Secure & Insured',
      icon: '🛡️',
      description: 'Every booking is covered by our comprehensive insurance policy for your peace of mind.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      title: '24/7 Concierge',
      icon: '🎧',
      description: 'Our dedicated support team is here to assist you with any questions or service updates.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      id: 3,
      title: 'Upfront Pricing',
      icon: '💰',
      description: 'No hidden fees or surprise costs. See the full price before you confirm your booking.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-[#F9FAFB] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We provide the best service experience with these key benefits
          </p>
          <div className="w-24 h-1 bg-black mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`
                relative group cursor-pointer transform transition-all duration-300
                ${hoveredFeature === feature.id ? 'scale-105' : 'scale-100'}
              `}
            >
              <div className={`
                bg-white rounded-xl shadow-lg overflow-hidden
                transition-all duration-300 h-full border border-gray-100
                ${hoveredFeature === feature.id ? 'shadow-2xl border-gray-200' : 'shadow-lg'}
              `}>
                <div className="p-8 text-center">
                  {/* Icon */}
                  <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto
                    transition-all duration-300
                    ${feature.bgColor}
                    ${hoveredFeature === feature.id ? 'scale-110' : 'scale-100'}
                  `}>
                    <span className={`text-4xl ${feature.iconColor}`}>
                      {feature.icon}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-black mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Gradient Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0
                  transition-opacity duration-300 rounded-xl pointer-events-none
                  ${hoveredFeature === feature.id ? 'opacity-5' : 'opacity-0'}
                `} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;