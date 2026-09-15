# Partie « Site Web » — SÉCUREX CONNECT (version corrigée d'après le code source)

> Cette section décrit **fidèlement** la partie site web de l'application telle qu'elle est réellement implémentée dans le code source du projet (`src/app`, `src/components`, `src/lib`). Elle remplace la description erronée du rapport initial.

## 1. Présentation générale

Le site web de SÉCUREX CONNECT est la partie publique de la plateforme de prise de rendez-vous pour un centre de **contrôle technique automobile agréé**, situé à Agadir (Maroc). Il est intégralement rédigé en français et s'adresse à la clientèle du centre.

Il est développé avec **Next.js 16** (App Router) et **React 19**, en **TypeScript**. La mise en page repose sur **Tailwind CSS 4** et la bibliothèque de composants **shadcn/ui** (basée sur Radix UI). Les animations sont gérées par **Framer Motion**, les icônes par **lucide-react**, et le thème clair/sombre par **next-themes**. Les données (catégories, services, tarifs, contenu éditable) proviennent d'une base **PostgreSQL** interrogée via l'ORM **Prisma**.

Le site n'est pas une simple vitrine statique : plusieurs pages sont rendues dynamiquement côté serveur (`dynamic = 'force-dynamic'`) et lisent leurs données directement en base à chaque requête.

## 2. Architecture des pages et navigation

Le code utilise les *route groups* de Next.js. Le groupe `(public)` partage une mise en page commune (en-tête + pied de page, métadonnées SEO, données structurées).

Les pages du site web sont :

- **Accueil** (`/`) — page vitrine principale.
- **Tarifs** (`/tarifs`) — grille tarifaire par catégorie de véhicule.
- **Documents** (`/documents`) — documents à fournir selon le type de véhicule.
- **FAQ** (`/faq`) — questions fréquentes.
- **Contact** (`/contact`) — formulaire et coordonnées.
- **Prendre rendez-vous** (`/rendez-vous`) — assistant de réservation en 4 étapes.
- **Espace client** (`/espace-client`) — connexion, inscription et tableau de bord client.

La barre de navigation principale (constante `PUBLIC_NAV`) propose : Accueil, Tarifs, Documents, FAQ, Contact.

**En-tête** (`header.tsx`) : barre supérieure discrète (téléphone, horaires, adresse), logo, menu de navigation, bouton de changement de thème clair/sombre, bouton d'appel à l'action « Prendre RDV », et menu mobile latéral (composant Sheet) affiché sur petit écran.

**Pied de page** (`footer.tsx`) : bloc identité + mention « Agréé par le Ministère du Transport », navigation, coordonnées de contact, réseaux sociaux (Facebook, Instagram, LinkedIn, TikTok), carte Google Maps intégrée, et un lien discret « Espace Administrateur » menant à la page de connexion de l'administration.

## 3. Page d'accueil

La page d'accueil (`(public)/page.tsx`) est un composant serveur qui charge en parallèle le contenu éditable du site et les catégories de véhicules. Elle se compose de quatre sections :

1. **Section héro** : image de fond avec dégradé vert de la marque, badge (« Agréé Ministère du Transport »), titre avec mot mis en évidence, sous-titre, deux boutons (« Prendre rendez-vous » et « Voir les tarifs »), indicateurs de confiance (contrôle en 30 min, certificat officiel, plus de 15 000 contrôles réalisés) et une scène animée d'inspection. **Tous ces textes sont modifiables** par le Super Admin, car ils proviennent de la table `WebsiteContent` (fonction `getWebsiteContent`).

2. **Bandeau de statistiques** : quatre compteurs animés (composant `StatsCounter`) — contrôles réalisés, satisfaction client, durée moyenne, taux d'agrément — dont les valeurs sont également éditables depuis la base.

3. **Section services** : les catégories de véhicules et leur prix minimum sont chargés dynamiquement depuis la base (catégories + services actifs, triés par prix). Chaque carte affiche l'icône, le nom, la description, le prix « à partir de » (formaté en dirhams via `formatMAD`) et un bouton « Réserver » qui pré-sélectionne la catégorie dans l'assistant de réservation.

4. **Bandeau d'appel à l'action final** invitant à réserver ou à poser une question.

## 4. Page Tarifs

La page Tarifs (`/tarifs`) est un composant serveur qui récupère les catégories et leurs services actifs (triés par prix croissant). Chaque catégorie est présentée sous forme de carte listant les prestations avec leur description, leur **durée** (en minutes) et leur **prix** (en MAD), plus un bouton « Réserver ». Un encart précise que les tarifs sont indicatifs et qu'un devis détaillé est remis sur place.

## 5. Page Documents

La page Documents (`/documents`) présente, pour chacun des quatre types de véhicules (voiture particulière, utilitaire, moto & deux-roues, poids lourd & camion), la liste des pièces à fournir (carte grise, attestation d'assurance, carte d'identité, etc.). Le contenu est statique dans le code. Un encart d'avertissement rappelle qu'en l'absence d'un document requis, le contrôle ne peut pas être effectué.

## 6. Page FAQ

La page FAQ (`/faq`) affiche un accordéon (composant Accordion) regroupant onze questions/réponses relatives au contrôle technique au Maroc : fréquence obligatoire, durée, documents, contre-visite et son tarif, conduite à tenir en cas d'échec, validité du certificat, moyens de paiement, rappels d'échéance, horaires d'ouverture, etc. Le contenu est défini dans le code et réutilise les constantes de la marque (`BRAND`).

## 7. Page Contact

La page Contact (`/contact`) est un composant client comportant un formulaire (nom, téléphone, e-mail optionnel, sujet, message) validé côté client avec **react-hook-form** et **Zod** (notamment la validation du numéro marocain au format +212). À côté du formulaire figurent les informations de contact (adresse, téléphone, e-mail, horaires), les réseaux sociaux et une carte Google Maps intégrée avec lien d'itinéraire.

**Précision technique importante :** l'envoi du formulaire est actuellement **simulé** — le code attend brièvement puis affiche un message de succès ; il n'existe pas de route d'API dédiée à l'envoi des messages de contact. Cette fonctionnalité reste donc à connecter à un service réel (e-mail ou base de données).

## 8. Assistant de réservation (`/rendez-vous`)

C'est la pièce maîtresse du site. Il s'agit d'un **assistant en 4 étapes** (composant client), avec indicateur de progression et transitions animées :

1. **Véhicule** — choix de la catégorie de véhicule, chargée depuis l'API `/api/categories`. La catégorie peut être pré-sélectionnée via un paramètre d'URL (`?category=`) lorsqu'on arrive depuis la page d'accueil ou des tarifs.

2. **Service & Créneau** — choix de la prestation (avec son prix), puis de la **date** via un calendrier (react-day-picker, en français) et d'un **créneau horaire**. Le calendrier désactive automatiquement les dimanches, les dates passées et les **jours complets** (information obtenue via l'API `/api/capacity`). Les créneaux proposés respectent les horaires réels d'ouverture (fonction `getSlotsForDate`) ; les créneaux déjà réservés (API `/api/slots`) et les créneaux passés du jour même sont désactivés.

3. **Informations** — formulaire client validé par react-hook-form + Zod : nom complet, téléphone (+212), e-mail, **mot de passe + confirmation** (6 caractères minimum, avec affichage/masquage), immatriculation (validation et mise en forme de la plaque marocaine en caractères arabes), marque, modèle, année du véhicule, et canal de contact préféré (SMS, WhatsApp ou e-mail).

4. **Confirmation** — récapitulatif complet, puis envoi de la réservation (`POST /api/appointments`). En cas de succès, l'écran de confirmation (`BookingSuccess`) affiche le **code de référence à 6 caractères** et le numéro de passage.

La réservation est enregistrée avec le statut **« En attente » (PENDING)** ; elle doit être confirmée par l'administration pour passer à « Confirmé » et générer le QR code de validation. La prise de rendez-vous crée automatiquement le compte client (e-mail + mot de passe) si celui-ci n'existe pas encore.

## 9. Espace client (`/espace-client`)

L'espace client est un composant client qui vérifie d'abord la session via `/api/auth/me` :

- **Non connecté** : deux onglets *Connexion* / *Inscription*. La connexion se fait par e-mail + mot de passe ; l'inscription demande nom, téléphone, e-mail et mot de passe.
- **Connecté** : un tableau de bord affichant un message de bienvenue, des statistiques (rendez-vous à venir, contrôles validés, véhicules enregistrés), des cartes d'état par véhicule (statut et date d'expiration du contrôle calculés automatiquement) et la liste des prochains rendez-vous. Pour un rendez-vous confirmé, un bouton permet d'afficher le **QR code** de validation. Des sous-pages complètent l'espace : mes rendez-vous (`/espace-client/rdv`), historique (`/historique`) et profil (`/profil`).

## 10. Design, expérience utilisateur et SEO

L'identité visuelle repose sur un **vert professionnel (#00C896)** décliné en dégradé de marque, avec des effets de *glassmorphism* et des animations d'apparition (composant `Reveal`, Framer Motion). L'interface est **responsive** (menu latéral sur mobile) et propose un **mode clair/sombre**.

Le référencement est soigné : chaque page définit ses métadonnées (titre, description, URL canonique), des balises Open Graph, et la page publique inclut des **données structurées JSON-LD** de type `LocalBusiness` (nom, adresse à Agadir, téléphone, horaires, fourchette de prix) pour améliorer la visibilité sur les moteurs de recherche.

Enfin, une partie du contenu du site (héro et statistiques de la page d'accueil) constitue un **mini-CMS** : ces textes sont stockés en base et modifiables depuis l'interface d'administration (module « Gestion du site » du Super Admin), sans toucher au code.

## 11. Points de vigilance relevés dans le code

- Le **formulaire de contact n'est pas fonctionnel côté serveur** (envoi simulé) ; il faudra le connecter à un service d'e-mail ou l'enregistrer en base.
- Une **incohérence sur les horaires** existe entre les constantes de la marque (Lun–Ven 8h–16h, Sam 8h–12h) et certains textes (données JSON-LD et FAQ indiquant 8h–18h / 8h–13h) ; il conviendrait d'uniformiser.
