export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <title>Politique de Confidentialité - Espace Paroissial</title>
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 sm:p-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Politique de Confidentialité</h1>
        <p className="text-slate-600 mb-8">Dernière mise à jour : janvier 2026</p>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-700 leading-relaxed">
            Cette Politique de Confidentialité décrit comment l'application <strong>Espace Paroissial</strong>, gérée par la paroisse, recueille, utilise et protège vos données personnelles. En utilisant notre application, vous acceptez les pratiques décrites dans cette politique.
          </p>
        </section>

        {/* Données collectées */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Données Collectées</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            L'application recueille les données personnelles suivantes lors de votre inscription et utilisation :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li><strong>Adresse email</strong> : Utilisée pour authentifier votre compte et vous contacter</li>
            <li><strong>Nom complet</strong> : Requis pour identifier votre profil au sein de la communauté paroissiale</li>
            <li><strong>Photo de profil (avatar)</strong> : Optionnelle, pour personnaliser votre compte</li>
            <li><strong>Données de connexion OAuth</strong> : Si vous vous connectez via Facebook, Google ou d'autres fournisseurs tiers, nous recueillons uniquement le profil public et votre adresse email (avec votre consentement)</li>
          </ul>
        </section>

        {/* Finalité de la collecte */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Finalité de la Collecte</h2>
          <p className="text-slate-700 leading-relaxed">
            Les données recueillies sont utilisées pour :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mt-3">
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Vous permettre d'accéder aux fonctionnalités privées de l'application</li>
            <li>Vous envoyer des notifications et mises à jour importantes relatives à la paroisse</li>
            <li>Améliorer et sécuriser l'application</li>
          </ul>
        </section>

        {/* Base légale */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Base Légale</h2>
          <p className="text-slate-700 leading-relaxed">
            Le traitement de vos données personnelles est basé sur <strong>votre consentement explicite</strong> lors de votre inscription et utilisation de l'application. Vous êtes libre de refuser ou de retirer votre consentement à tout moment.
          </p>
        </section>

        {/* Conservation des données */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Conservation des Données</h2>
          <p className="text-slate-700 leading-relaxed">
            Vos données personnelles sont conservées tant que votre compte reste actif. Si vous décidez de supprimer votre compte, toutes vos données seront supprimées définitivement de nos serveurs, conformément aux délais légaux applicables.
          </p>
        </section>

        {/* Droits des utilisateurs */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Vos Droits</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous avez le droit de :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li><strong>Droit d'accès</strong> : Consulter l'ensemble de vos données personnelles</li>
            <li><strong>Droit de rectification</strong> : Corriger ou mettre à jour vos données</li>
            <li><strong>Droit à l'oubli (suppression)</strong> : Demander la suppression complète de vos données</li>
            <li><strong>Droit à la portabilité</strong> : Recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> : Vous opposer au traitement de vos données</li>
          </ul>
        </section>

        {/* Suppression des données */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Comment Supprimer Vos Données</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Vous pouvez supprimer votre compte et toutes vos données personnelles de deux façons :
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <h3 className="font-bold text-slate-900 mb-2">Méthode 1 : Via l'application (autonome)</h3>
            <p className="text-slate-700">
              Connectez-vous à votre compte, accédez à la section <strong>Profil</strong> ou <strong>Paramètres du compte</strong>, et utilisez l'option <strong>Supprimer mon compte</strong>. Cette action supprimera définitivement votre profil et toutes vos données associées de notre base de données.
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <h3 className="font-bold text-slate-900 mb-2">Méthode 2 : Par contact direct (alternative)</h3>
            <p className="text-slate-700">
              Si vous rencontrez des difficultés ou préférez une assistance, vous pouvez demander la suppression de vos données en nous contactant directement à l'adresse email : <br />
              <strong className="text-blue-600">basilediane71@gmail.com</strong>
            </p>
            <p className="text-slate-700 mt-2">
              Veuillez indiquer l'adresse email associée à votre compte. Nous traiterons votre demande dans les meilleurs délais, généralement sous 30 jours.
            </p>
          </div>
        </section>

        {/* Sécurité */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Sécurité des Données</h2>
          <p className="text-slate-700 leading-relaxed">
            Vos données personnelles sont protégées par des mesures de sécurité robustes. L'application utilise le service d'authentification sécurisé <strong>Supabase</strong>, qui offre un chiffrement de haut niveau et une protection avancée contre les accès non autorisés. Nous nous efforçons de maintenir les normes les plus élevées de sécurité des données.
          </p>
        </section>

        {/* Modifications de la politique */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Modifications de Cette Politique</h2>
          <p className="text-slate-700 leading-relaxed">
            Nous nous réservons le droit de mettre à jour cette Politique de Confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour. Nous vous recommandons de consulter régulièrement cette page pour rester informé de toute modification.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact</h2>
          <p className="text-slate-700 leading-relaxed">
            Si vous avez des questions concernant cette Politique de Confidentialité ou si vous souhaitez exercer l'un de vos droits, veuillez nous contacter à :
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded p-4 mt-4">
            <p className="text-slate-700"><strong>Email :</strong> basilediane71@gmail.com</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            Cette Politique de Confidentialité est effective à partir de janvier 2026 et peut être modifiée à tout moment.
          </p>
        </footer>
      </div>
    </main>
  );
}
