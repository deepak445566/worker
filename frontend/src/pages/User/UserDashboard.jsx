import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ServiceCategories from './ServiceCategory';
import FeaturesSection from './FeaturesSection';

const Dashboard = () => {
  const { user} = useAuth();
  const navigate = useNavigate();
  
  const [bookingStats, setBookingStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(false);


 
  // Fetch user's booking stats and recent bookings
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
   
      
      const response = await axios.get('https://worker-ibbp.onrender.com/api/bookings/my-bookings', {
       withCredentials: true
      });
      
      if (response.data.success) {
        setBookingStats(response.data.stats || {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          completed: 0,
          totalSpent: 0
        });
        setRecentBookings(response.data.bookings?.slice(0, 5) || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

 

 

  return (
    <div className="min-h-screen bg-[#F9FAFB] park">
      {/* Navbar */}
    

      {/* Hero Section */}
      <div className=" text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-12 justify-between">
            {/* Left side - Text Content */}
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 abr">
                Welcome back, {user?.name}!
              </h1>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 uppercase">
                Book <span className='text-[#2B7FFF]'>Trusted </span> Services Near You
              </h1>
              <p className="text-md md:text-lg mb-6">
                Your trusted partner for all service needs. Find professional workers, 
                book services, and manage everything from one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/user/services')}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-white hover:text-black transition-colors shadow-lg"
                >
                  Book a Service Now
                </button>
                <button
                  onClick={() => navigate('/user/my-bookings')}
                  className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-[#2B7FFF] hover:text-white transition-colors shadow-lg"
                >
                  View My Bookings
                </button>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="md:w-1/2  flex justify-center">
              <img
                src="https://img.freepik.com/free-vector/construction-workers-flat-composition-poster_1284-18981.jpg?uid=R147146038&ga=GA1.1.1143478574.1762934262&semt=ais_hybrid&w=740&q=80"
                alt="Professional Services"
                className="rounded-lg shadow-2xl w-full h-[70vh] object-cover"
                
              />
            </div>
          </div>
        </div>
      </div>

<ServiceCategories/>
<FeaturesSection/>

   

      {/* Footer */}
   
    </div>
  );
};

export default Dashboard;