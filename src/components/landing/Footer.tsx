import { Twitter, Facebook, Instagram } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 pt-10 sm:pt-16 pb-8">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">

                    {/* Brand */}
                    <div className="sm:col-span-2">
                        <div className="mb-6">
                            <Logo size="md" />
                        </div>
                        <p className="text-slate-400 max-w-sm mb-6">
                            La première plateforme d'automatisation WhatsApp conçue pour le commerce en Afrique.
                            Gagnez du temps, augmentez vos ventes.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                                <Twitter className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                                <Facebook className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                                <Instagram className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Produit</h4>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Fonctionnalités</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Tarifs</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Témoignages</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">API</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Entreprise</h4>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">À propos</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Carrières</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
                    <p>© 2025 VibeVendor. Tous droits réservés.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-slate-400">Confidentialité</a>
                        <a href="#" className="hover:text-slate-400">CGU</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
