import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { services, technicians } from '../data/servicesData';

const STORAGE_KEY = 'repairBooking';
const LANGUAGE_KEY = 'siteLanguage';

const BookingContext = createContext();

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) || 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
  }, [bookingData]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const updateBooking = useCallback((data) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  }, []);

    const clearBooking = () => {
        setBookingData({});
        localStorage.removeItem(STORAGE_KEY);
    };

  const findServiceByKey = (key) => {
    return services.find((service) => service.key === key);
  };

  const findTechnicianByKey = (key) => {
    return technicians.find((tech) => tech.key === key);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'));
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        updateBooking,
        clearBooking,
        findServiceByKey,
        findTechnicianByKey,
        language,
        setLanguage,
        toggleLanguage
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};