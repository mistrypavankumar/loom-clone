import React from 'react';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Navbar />
      <Toaster />
      {children}
    </div>
  );
};
export default Layout;
