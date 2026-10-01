import { Home, Instagram, Twitter, Linkedin, Facebook } from "lucide-react";

const SOCIAL_ICONS = [Instagram, Twitter, Linkedin, Facebook];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-gold rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl">
                Prestige<span className="text-gold">Homes</span>
              </span>
            </div>
            <p className="text-primary-foreground/60 text-sm font-body leading-relaxed mb-5">
              Curating extraordinary properties for discerning buyers, sellers, and renters since 1999.
            </p>
            <div className="flex gap-3">
              {SOCIAL_ICONS.map((SocialIcon, i) => (
                <button key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-150" aria-label="Social">
                  <SocialIcon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Properties",
              links: ["Buy Property", "Rent Property", "Sell Property", "New Developments", "Luxury Homes"],
            },
            {
              title: "Company",
              links: ["About Us", "Our Team", "Careers", "Press", "Contact"],
            },
            {
              title: "Resources",
              links: ["Mortgage Calculator", "Market Reports", "Neighborhood Guide", "Blog", "FAQ"],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-gold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <button className="text-sm font-body text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-150">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body text-primary-foreground/40">
          <span>© 2025 PrestigeHomes. All rights reserved.</span>
          <div className="flex gap-4">
            <button className="hover:text-primary-foreground/70 transition-colors duration-150">Privacy Policy</button>
            <button className="hover:text-primary-foreground/70 transition-colors duration-150">Terms of Service</button>
            <button className="hover:text-primary-foreground/70 transition-colors duration-150">Cookie Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
}