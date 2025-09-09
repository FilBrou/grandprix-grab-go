import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProductsFromDatabase from '@/components/ProductsFromDatabase';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <div className="container mx-auto px-4 py-8">
          <ProductsFromDatabase />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
