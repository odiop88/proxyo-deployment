
export default function Footer(){
    return(
        <footer className="bg-violet text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="lg:col-span-2">
              <h3 className="text-3xl font-bold mb-4 text-lavender">Proxyo</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                La plateforme qui connecte clients et prestataires de services professionnels partout en France.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg text-lavender">Services</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-lavender transition-colors">Tous les services</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Zones d'intervention</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg text-lavender">Entreprise</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-lavender transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg text-lavender">Légal</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-lavender transition-colors">Conditions générales</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-lavender transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white border-opacity-20 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Proxyo. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    )
}