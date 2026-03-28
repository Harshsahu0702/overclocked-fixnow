import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landingpage from './pages/customer/Landingpage';
import BookingPage from './pages/customer/BookingPage';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerSignup from './pages/partner/PartnerSignup';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuthModal from './components/AuthModal';

const AppContent = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState('customer');

  const openLogin = (role = 'customer') => {
    setAuthRole(role);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        role={authRole}
      />
      <Routes>
        <Route path="/" element={<Landingpage onLoginClick={() => openLogin('customer')} />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/partner" element={<PartnerDashboard />} />
        <Route path="/partner-signup" element={<PartnerSignup />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
