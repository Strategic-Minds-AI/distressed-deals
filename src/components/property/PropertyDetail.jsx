import { useState } from "react";
import {
  X, ChevronLeft, ChevronRight, Heart, Share2, MapPin, Bed, Bath,
  Square, Car, Calendar, Check, Phone, Mail, Star, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "./PropertyCard";

const TYPE_LABEL = { buy: "For Sale", rent: "For Rent", sell: "Selling" };
const TYPE_COLOR = { buy: "gradient-navy", rent: "gradient-gold", sell: "bg-emerald-600" };

export default function PropertyDetail({ property, onClose, favorites, onToggleFavorite }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  if (!property) return null;

  const isFav = favorites?.includes(property.id);

  const prevImg = () => setImgIdx(i => (i - 1 + property.images.length) % property.images.length);
  const nextImg = () => setImgIdx(i => (i + 1) % property.images.length);

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-border flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-body font-medium text-foreground hover:text-primary transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite?.(property.id)}
            className="p-2 rounded-full border border-border hover:border-rose-300 transition-colors duration-150"
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
          </button>
          <button className="p-2 rounded-full border border-border hover:border-primary transition-colors duration-150" aria-label="Share">
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main image gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden h-[480px]">
          {/* Main image */}
          <div className="lg:col-span-2 relative overflow-hidden">
            <img
              src={property.images[imgIdx]}
              alt={property.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowGallery(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

            <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass-dark text-white hover:bg-white/20 transition-colors duration-150" aria-label="Prev">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass-dark text-white hover:bg-white/20 transition-colors duration-150" aria-label="Next">
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3 left-3 flex gap-1.5">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${TYPE_COLOR[property.type]}`}>
                {TYPE_LABEL[property.type]}
              </span>
              {property.tags.map(tag => (
                <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>

            <div className="absolute bottom-3 right-3 text-sm text-white/80 font-body glass-dark px-3 py-1 rounded-full">
              {imgIdx + 1} / {property.images.length}
            </div>
          </div>

          {/* Thumbnail grid */}
          {property.images.length > 1 && (
            <div className="hidden lg:grid grid-rows-2 gap-3">
              {property.images.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden cursor-pointer rounded-lg"
                  onClick={() => setImgIdx(i + 1)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  {i === 1 && property.images.length > 3 && (
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                      onClick={() => setShowGallery(true)}
                    >
                      <span className="text-white font-display font-bold text-xl">+{property.images.length - 3} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body: left info + right contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + price */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="font-body text-sm">{property.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-foreground">
                    {formatPrice(property.price, property.type, property.rentPeriod)}
                  </div>
                  {property.type !== "rent" && (
                    <div className="text-muted-foreground text-sm font-body">
                      ${property.pricePerSqft.toLocaleString()} / ft²
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Bed, label: "Bedrooms", value: property.beds },
                { icon: Bath, label: "Bathrooms", value: property.baths },
                { icon: Square, label: "Square Feet", value: `${property.sqft.toLocaleString()} ft²` },
                { icon: Car, label: "Garage", value: property.garage + " cars" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="p-2 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-display font-bold text-lg text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground font-body">{label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">About This Property</h2>
              <p className="text-muted-foreground font-body leading-relaxed text-[15px]">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Amenities & Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.amenities.map(amenity => (
                  <div key={amenity} className="flex items-center gap-2 text-sm font-body text-foreground">
                    <div className="w-5 h-5 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Property Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Year Built", value: property.yearBuilt },
                  { label: "Property Type", value: property.category },
                  { label: "Listing Status", value: property.status },
                  { label: "Price/sqft", value: `$${property.pricePerSqft.toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-border">
                    <span className="text-sm text-muted-foreground font-body">{label}</span>
                    <span className="text-sm font-medium font-body text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Location</h2>
              <div className="h-64 bg-muted rounded-2xl overflow-hidden relative">
                <img
                  src={`https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=60`}
                  alt="Map"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card rounded-xl shadow-lg px-4 py-3 text-center">
                    <MapPin className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="font-body text-sm font-medium text-foreground">{property.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Agent + Contact */}
          <div className="space-y-6">
            {/* Agent card */}
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
              <h3 className="font-display text-lg font-bold text-foreground mb-4">Listed By</h3>
              <div className="flex items-center gap-3 mb-5">
                <img
                  src={property.agent.avatar}
                  alt={property.agent.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gold"
                />
                <div>
                  <div className="font-body font-semibold text-foreground">{property.agent.name}</div>
                  <div className="text-xs text-muted-foreground font-body">{property.agent.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-gold text-gold" />)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <a href={`tel:${property.agent.phone}`} className="flex items-center gap-2 text-sm font-body text-foreground hover:text-primary transition-colors duration-150">
                  <Phone className="w-4 h-4 text-muted-foreground" /> {property.agent.phone}
                </a>
              </div>

              {/* Contact form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <h4 className="font-body text-sm font-semibold text-foreground">Send a Message</h4>
                <input
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full text-sm font-body border border-border rounded-lg px-3 py-2.5 bg-background outline-none focus:border-primary transition-colors duration-150"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full text-sm font-body border border-border rounded-lg px-3 py-2.5 bg-background outline-none focus:border-primary transition-colors duration-150"
                />
                <textarea
                  placeholder={`I'm interested in ${property.title}…`}
                  rows={3}
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  required
                  className="w-full text-sm font-body border border-border rounded-lg px-3 py-2.5 bg-background outline-none focus:border-primary transition-colors duration-150 resize-none"
                />
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-body font-medium text-center border border-emerald-200"
                    >
                      ✓ Message sent!
                    </motion.div>
                  ) : (
                    <motion.button
                      key="btn"
                      type="submit"
                      className="w-full py-2.5 rounded-lg gradient-navy text-white text-sm font-body font-semibold hover:opacity-90 transition-opacity duration-150"
                    >
                      Send Message
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Price insights */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-display text-base font-bold text-foreground mb-3">Price Insights</h3>
              <div className="space-y-2">
                {[
                  { label: "Estimated Mortgage", value: `$${Math.round(property.type !== 'rent' ? property.price * 0.004 : 0).toLocaleString()}/mo` },
                  { label: "HOA Fees", value: "$450/mo" },
                  { label: "Property Tax (est.)", value: `$${Math.round(property.type !== 'rent' ? property.price * 0.012 / 12 : 0).toLocaleString()}/mo` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}