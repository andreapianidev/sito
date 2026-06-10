import React from 'react';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className={`bg-gradient-to-br from-gray-900 via-gray-800 to-brand-burgundy-dark text-white relative overflow-hidden`}>
      <div className="absolute inset-0">
        <div className={`absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]`}></div>
      </div>

      <div className="container-custom py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-pink to-brand-burgundy rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vilma Nardini
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Il tuo partner di fiducia per un percorso nutrizionale personalizzato e sostenibile verso il benessere.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-brand-pink hover:scale-110 transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-white">Servizi</h4>
            <ul className="space-y-3">
              {[
                'Consulenze Nutrizionali',
                'Piani Alimentari',
                'Coaching Online',
                'Analisi Corporea',
                'Educazione Alimentare'
              ].map((service, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-300 hover:text-brand-pink transition-colors duration-300 flex items-center group">
                    <span className="w-2 h-2 bg-brand-pink rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-white">Link Utili</h4>
            <ul className="space-y-3">
              {[
                { text: 'Chi Siamo', href: '/chi-sono' },
                { text: 'Servizi', href: '/servizi' },
                { text: 'Shop', href: '/shop' },
                { text: 'Contatti', href: '/contatti' },
                { text: 'Privacy Policy', href: '/privacy-policy' },
                { text: 'Termini e Condizioni', href: '/termini-condizioni' }
              ].map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-300 hover:text-brand-pink transition-colors duration-300 flex items-center group">
                    <span className="w-2 h-2 bg-brand-pink rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-white">Contatti</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-brand-pink/20 rounded-lg flex items-center justify-center group-hover:bg-brand-pink/30 transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <p className="text-white font-medium">Studio</p>
                  <p className="text-gray-300 text-sm">Via Rocca Imperiale 42<br />00118 Roma, Italia</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-brand-pink/20 rounded-lg flex items-center justify-center group-hover:bg-brand-pink/30 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <p className="text-white font-medium">Telefono</p>
                  <p className="text-gray-300 text-sm">+39 338 9522275</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-brand-pink/20 rounded-lg flex items-center justify-center group-hover:bg-brand-pink/30 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-brand-pink" />
                </div>
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-gray-300 text-sm">info@vilmanardini.it</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Dr.ssa Vilma Nardini. Tutti i diritti riservati.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="/privacy-policy" className="hover:text-brand-pink transition-colors duration-300">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="/cookie-policy" className="hover:text-brand-pink transition-colors duration-300">
                Cookie Policy
              </a>
              <span>•</span>
              <a href="/termini-condizioni" className="hover:text-brand-pink transition-colors duration-300">
                Termini e Condizioni
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}