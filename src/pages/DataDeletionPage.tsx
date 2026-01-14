export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <title>Suppression des Données Utilisateur - Espace Paroissial</title>
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 sm:p-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Instructions pour la Suppression des Données Utilisateur</h1>
        <p className="text-slate-600 mb-8">Dernière mise à jour : janvier 2026</p>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-700 leading-relaxed">
            Cette page explique comment vous pouvez supprimer vos données personnelles de l'application <strong>Espace Paroissial</strong>. Nous respectons votre droit à la confidentialité et à l'oubli, conformément à la législation sur la protection des données personnelles. Vous avez le contrôle complet sur vos informations et pouvez demander leur suppression à tout moment.
          </p>
        </section>

        {/* Méthode 1 : Via l'application */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold mr-3">1</span>
            Méthode 1 : Suppression autonome via l'application
          </h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Procédure rapide</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Vous pouvez supprimer votre compte et toutes vos données directement depuis l'application en suivant ces étapes :
            </p>
            
            <ol className="space-y-3 ml-4">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold mr-3 mt-1 flex-shrink-0">1</span>
                <span className="text-slate-700"><strong>Connectez-vous</strong> à votre compte Espace Paroissial avec vos identifiants (email et mot de passe)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold mr-3 mt-1 flex-shrink-0">2</span>
                <span className="text-slate-700">Accédez à votre <strong>Profil</strong> ou <strong>Paramètres du compte</strong> (généralement accessibles via un menu en haut à droite ou une icône de profil)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold mr-3 mt-1 flex-shrink-0">3</span>
                <span className="text-slate-700">Recherchez et cliquez sur le bouton ou l'option <strong>Supprimer mon compte</strong></span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold mr-3 mt-1 flex-shrink-0">4</span>
                <span className="text-slate-700">Confirmez votre choix. Une fenêtre de confirmation vous demandera de valider l'action</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold mr-3 mt-1 flex-shrink-0">5</span>
                <span className="text-slate-700"><strong>Votre compte sera supprimé définitivement</strong>, ainsi que toutes vos données personnelles associées</span>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-slate-700 flex items-start">
              <span className="mr-3 text-lg">⚠️</span>
              <span><strong>Attention :</strong> Cette action est irréversible. Une fois votre compte supprimé, vous ne pourrez pas récupérer vos données. Assurez-vous que c'est bien ce que vous souhaitez.</span>
            </p>
          </div>
        </section>

        {/* Méthode 2 : Par contact */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold mr-3">2</span>
            Méthode 2 : Demande de suppression par email
          </h2>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Procédure alternative</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Si vous rencontrez des difficultés à supprimer votre compte via l'application ou si vous préférez une assistance personnelle, vous pouvez nous demander directement de supprimer vos données par email :
            </p>

            <div className="bg-white border border-green-300 rounded p-4 mb-4">
              <h4 className="font-bold text-slate-900 mb-2">Adresse email de contact :</h4>
              <p className="text-lg text-green-700 font-mono">basilediane71@gmail.com</p>
            </div>

            <h4 className="font-bold text-slate-900 mb-3">Contenu recommandé de votre email :</h4>
            <div className="bg-slate-100 border border-slate-300 rounded p-4 font-mono text-sm text-slate-700 mb-4">
              <p className="mb-2"><strong>Sujet :</strong> Demande de suppression de compte et données personnelles</p>
              <p className="mb-2"><strong>Corps du message (exemple) :</strong></p>
              <p className="text-xs mb-4 bg-white p-2 rounded">
                Bonjour,<br /><br />
                Je demande la suppression complète de mon compte et de toutes mes données personnelles de l'application Espace Paroissial.<br /><br />
                Email associé au compte : [votre adresse email]<br /><br />
                Veuillez confirmer la suppression et me notifier une fois l'opération effectuée.<br /><br />
                Merci.
              </p>
            </div>

            <p className="text-slate-700 leading-relaxed">
              <strong>Délai de traitement :</strong> Nous traiterons votre demande dans les meilleurs délais, généralement sous <strong>30 jours</strong> conformément à la réglementation en vigueur.
            </p>
          </div>
        </section>

        {/* Confirmation */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Confirmation de la Suppression</h2>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded">
            <p className="text-slate-700 leading-relaxed mb-3">
              Une fois votre demande traitée (que ce soit via l'application ou par email), vous recevrez une <strong>confirmation</strong> :
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mt-3">
              <li>Un message de confirmation en cas de suppression via l'application</li>
              <li>Un email de confirmation si vous avez demandé la suppression par email</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Cette confirmation vous indiquera que vos données ont été complètement supprimées de nos serveurs.
            </p>
          </div>
        </section>

        {/* Questions supplémentaires */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions Supplémentaires ?</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Si vous avez d'autres questions concernant la suppression de vos données ou la gestion de votre compte, n'hésitez pas à nous contacter :
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <p className="text-slate-700"><strong>Email :</strong> basilediane71@gmail.com</p>
          </div>
        </section>

        {/* Information supplémentaire */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Informations Importantes</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-slate-300 pl-4">
              <h3 className="font-bold text-slate-900 mb-2">Conformité légale</h3>
              <p className="text-slate-700">
                Cette procédure respecte le Règlement Général sur la Protection des Données (RGPD) et le droit à l'oubli (droit à la suppression).
              </p>
            </div>
            <div className="border-l-4 border-slate-300 pl-4">
              <h3 className="font-bold text-slate-900 mb-2">Données archivées</h3>
              <p className="text-slate-700">
                Certaines données peuvent être conservées pendant une courte période à des fins légales ou de conformité, mais seront supprimées conformément aux délais légaux.
              </p>
            </div>
            <div className="border-l-4 border-slate-300 pl-4">
              <h3 className="font-bold text-slate-900 mb-2">Irrévocabilité</h3>
              <p className="text-slate-700">
                La suppression est définitive et irréversible. Vous ne pourrez pas récupérer vos données une fois supprimées.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            Cette page est effective à partir de janvier 2026. Pour toute question relative à la suppression des données, veuillez nous contacter.
          </p>
        </footer>
      </div>
    </main>
  );
}
