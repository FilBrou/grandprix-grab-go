import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/icon-192.png" alt="GP Montreal" className="h-8 w-8" />
              <h3 className="text-lg font-bold">GP Montréal</h3>
            </div>
            <p className="text-sm text-secondary-foreground/80">
              Plateforme officielle de commande pour le Grand Prix de Montréal
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Catalogue</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Points de collecte</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Mon compte</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li>Circuit Gilles-Villeneuve</li>
              <li>Montréal, QC</li>
              <li>support@gpmontreal.com</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/60">
            © 2024 Grand Prix de Montréal. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;