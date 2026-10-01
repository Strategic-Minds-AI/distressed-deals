import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroCarousel from "../components/property/HeroCarousel";
import FeaturedCarousel from "../components/property/FeaturedCarousel";
import PropertyGrid from "../components/property/PropertyGrid";
import PropertyDetail from "../components/property/PropertyDetail";
import FavoritesPanel from "../components/property/FavoritesPanel";
import StatsSection from "../components/sections/StatsSection";
import WhyChooseUs from "../components/sections/WhyChooseUs";
import TestimonialsCarousel from "../components/sections/TestimonialsCarousel";
import NewsletterSection from "../components/sections/NewsletterSection";
import AgentsSection from "../components/sections/AgentsSection";

export default function Home() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);

  const toggleFavorite = (id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        favoritesCount={favorites.length}
        onShowFavorites={() => setShowFavorites(true)}
      />

      {/* Hero */}
      <HeroCarousel onSearch={setSearchFilters} />

      {/* Stats */}
      <StatsSection />

      {/* Featured Carousel */}
      <FeaturedCarousel
        onSelectProperty={setSelectedProperty}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Full property grid */}
      <PropertyGrid
        filters={searchFilters}
        onSelectProperty={setSelectedProperty}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* Agents */}
      <AgentsSection />

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* Newsletter */}
      <NewsletterSection />

      {/* Footer */}
      <Footer />

      {/* Property Detail Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetail
            key={selectedProperty.id}
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>

      {/* Favorites Side Panel */}
      {showFavorites && (
        <FavoritesPanel
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onSelectProperty={setSelectedProperty}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}