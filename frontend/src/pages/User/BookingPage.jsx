import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookingPage = ({ worker, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    location: '',
    hours: 1,
    service: worker?.service || ''
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const workerPrice = worker?.price || worker?.rate || 0;

  // Time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', 
    '05:00 PM', '06:00 PM'
  ];

  // Calculate total amount
  const calculateTotalAmount = () => {
    const subtotal = workerPrice * bookingData.hours;
    return subtotal;
  };

  const totalWithFee = calculateTotalAmount() + (calculateTotalAmount() * 0.1);
  const totalAmount = calculateTotalAmount();

  // Format address like Google Maps
  const formatAddressLikeGoogle = async (rawAddress) => {
    if (!rawAddress || rawAddress.length < 3) {
      alert('Please enter an address first');
      return;
    }

    setIsFormatting(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawAddress)}&addressdetails=1&limit=1&countrycodes=in`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const address = data[0];
        const components = address.address;
        
        const houseNo = components.house_number || '';
        const road = components.road || components.pedestrian || '';
        const suburb = components.suburb || components.neighbourhood || '';
        const city = components.city || components.town || components.village || '';
        const state = components.state || '';
        const pincode = components.postcode || '';
        const landmark = components.landmark || '';
        
        let formattedAddress = '';
        
        if (houseNo) formattedAddress += `${houseNo}, `;
        if (road) formattedAddress += `${road}, `;
        if (landmark) formattedAddress += `near ${landmark}, `;
        if (suburb) formattedAddress += `${suburb}, `;
        if (city) formattedAddress += `${city}, `;
        if (state) formattedAddress += `${state}`;
        if (pincode) formattedAddress += ` - ${pincode}`;
        
        formattedAddress = formattedAddress.replace(/, $/, '');
        
        setBookingData(prev => ({
          ...prev,
          location: formattedAddress
        }));
        
        alert('✅ Address formatted successfully!');
      } else {
        const manualFormatted = formatAddressManually(rawAddress);
        setBookingData(prev => ({
          ...prev,
          location: manualFormatted
        }));
        alert('⚠️ Address formatted manually. Please verify.');
      }
    } catch (error) {
      console.error('Address formatting error:', error);
      const manualFormatted = formatAddressManually(rawAddress);
      setBookingData(prev => ({
        ...prev,
        location: manualFormatted
      }));
    } finally {
      setIsFormatting(false);
      setShowSuggestions(false);
    }
  };

  // Manual address formatting helper
  const formatAddressManually = (address) => {
    let formatted = address
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Block(\s*)(\d+)/gi, 'Block $2')
      .replace(/Sector(\s*)(\d+)/gi, 'Sector $2')
      .replace(/Flat(\s*)(\d+)/gi, 'Flat $2')
      .replace(/House(\s*)(\d+)/gi, 'House $2')
      .replace(/C-(\d+)/gi, 'C-$1')
      .replace(/\s+,/g, ',')
      .replace(/,+/g, ',');
    
    return formatted;
  };

  // Search address with autocomplete
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=in`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const suggestions = data.map(item => ({
          full: item.display_name,
          houseNo: item.address?.house_number || '',
          road: item.address?.road || '',
          area: item.address?.suburb || item.address?.neighbourhood || '',
          city: item.address?.city || item.address?.town || '',
          state: item.address?.state || '',
          pincode: item.address?.postcode || ''
        }));
        setAddressSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions([]);
    }
  };

  // Select address from suggestion
  const selectAddress = (suggestion) => {
    let formattedAddress = '';
    
    if (suggestion.houseNo) formattedAddress += `${suggestion.houseNo}, `;
    if (suggestion.road) formattedAddress += `${suggestion.road}, `;
    if (suggestion.area) formattedAddress += `${suggestion.area}, `;
    if (suggestion.city) formattedAddress += `${suggestion.city}, `;
    if (suggestion.state) formattedAddress += `${suggestion.state}`;
    if (suggestion.pincode) formattedAddress += ` - ${suggestion.pincode}`;
    
    formattedAddress = formattedAddress.replace(/, $/, '');
    
    setBookingData(prev => ({
      ...prev,
      location: formattedAddress || suggestion.full
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Detect current location
  const detectCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const components = data.address;
            const houseNo = components.house_number || '';
            const road = components.road || '';
            const area = components.suburb || components.neighbourhood || '';
            const city = components.city || components.town || components.village || '';
            const state = components.state || '';
            const pincode = components.postcode || '';
            
            let formattedAddress = '';
            if (houseNo) formattedAddress += `${houseNo}, `;
            if (road) formattedAddress += `${road}, `;
            if (area) formattedAddress += `${area}, `;
            if (city) formattedAddress += `${city}, `;
            if (state) formattedAddress += `${state}`;
            if (pincode) formattedAddress += ` - ${pincode}`;
            
            formattedAddress = formattedAddress.replace(/, $/, '');
            
            setBookingData(prev => ({
              ...prev,
              location: formattedAddress || data.display_name
            }));
            alert('✅ Current location detected!');
          } else {
            setBookingData(prev => ({
              ...prev,
              location: `${latitude}, ${longitude}`
            }));
          }
        } catch (error) {
          setBookingData(prev => ({
            ...prev,
            location: `${latitude}, ${longitude}`
          }));
        }
        setLocationLoading(false);
      },
      (error) => {
        alert('Unable to detect location. Please enter manually.');
        setLocationLoading(false);
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
    
    if (name === 'location') {
      searchAddress(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingData.date) {
      alert('Please select a date');
      return;
    }
    if (!bookingData.time) {
      alert('Please select a time');
      return;
    }
    if (!bookingData.location) {
      alert('Please enter your complete address');
      return;
    }
    
    setBookingLoading(true);
    
    try {
      
      
      const bookingPayload = {
        workerId: worker._id,
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time,
        location: bookingData.location,
        totalAmount: totalAmount,
        hours: bookingData.hours
      };
      
      const response = await axios.post(
        'https://worker-ibbp.onrender.com/api/bookings',
        bookingPayload,
        {
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        alert('✅ Booking created successfully!');
        if (onSuccess) onSuccess();
        navigate('/user/my-bookings');
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl sm:my-8 sm:mx-4 animate-slideUp sm:animate-none">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black rounded-t-2xl p-4 sm:p-6 text-white z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-8">
              <h2 className="text-lg sm:text-2xl font-bold">Book Your Service</h2>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5 sm:mt-1">Fill in the details to confirm</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1 -mt-1 sm:-mt-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Worker Info Card - Mobile Optimized */}
          <div className="mb-4 sm:mb-6 bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-2xl">
                {worker?.service === 'Plumber' && '🔧'}
                {worker?.service === 'Electrician' && '⚡'}
                {worker?.service === 'Carpenter' && '🪚'}
                {worker?.service === 'Painter' && '🎨'}
                {worker?.service === 'Cleaner' && '🧹'}
                {worker?.service === 'AC Repair' && '❄️'}
                {!worker?.service && '👨‍🔧'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{worker?.userId?.name}</p>
              <p className="text-gray-500 text-xs">{worker?.service}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-xs text-gray-600">4.8 (124 reviews)</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-gray-900">₹{workerPrice}</p>
              <p className="text-[10px] text-gray-500">/hour</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="text-sm">📅</span> Select Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={bookingData.date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-gray-900 text-sm"
                />
              </div>
              
              {/* Time Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="text-sm">⏰</span> Select Time
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {timeSlots.slice(0, 9).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingData({ ...bookingData, time: slot })}
                      className={`px-2 py-1.5 text-xs rounded-lg transition-all ${
                        bookingData.time === slot
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="text-sm">⏱️</span> Duration (hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    name="hours"
                    value={bookingData.hours}
                    onChange={handleInputChange}
                    min="0.5"
                    max="8"
                    step="0.5"
                    className="flex-1 h-2 bg-gray-200 rounded-lg accent-gray-900"
                  />
                  <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold text-sm min-w-[60px] text-center">
                    {bookingData.hours}h
                  </div>
                </div>
              </div>
              
              {/* Address Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="text-sm">📍</span> Complete Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="location"
                    value={bookingData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., c1219 block2 nandgram"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-gray-900 text-sm placeholder-gray-400"
                  />
                  
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectAddress(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <p className="text-[10px] text-gray-500">{suggestion.houseNo} {suggestion.road}</p>
                          <p className="text-xs text-gray-900">{suggestion.area}, {suggestion.city}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => formatAddressLikeGoogle(bookingData.location)}
                    disabled={isFormatting || !bookingData.location}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    {isFormatting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span>Wait...</span>
                      </>
                    ) : (
                      <>
                        ✨ Format
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={detectCurrentLocation}
                    disabled={locationLoading}
                    className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span>Wait...</span>
                      </>
                    ) : (
                      <>
                        📍 Detect
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Price Breakdown - Mobile Optimized */}
              {workerPrice > 0 && bookingData.hours > 0 && (
                <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3">
                  <h3 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-1.5">
                    <span>💰</span> Price Breakdown
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fee ({bookingData.hours} hr × ₹{workerPrice})</span>
                      <span className="font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Charge (10%)</span>
                      <span className="font-semibold text-gray-900">₹{(totalAmount * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">₹{totalWithFee.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bookingLoading}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-1"
              >
                {bookingLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Please wait...
                  </>
                ) : (
                  <>
                    Confirm
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

<style jsx>{`
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`}</style>