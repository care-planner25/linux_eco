# Eco-système — client Linux (écosystème Care-Planner)

Version Linux de l'application Eco-système, construite avec **Electron**
(moteur Chromium, donc rendu identique à la version Windows). Mêmes
fonctions : onglets multiples, accès direct aux modules de l'écosystème,
onglets colorés par module, session partagée.

> Pourquoi Electron et pas le code Windows ? La version Windows repose sur
> WebView2 + .NET Framework + WinForms, qui sont exclusivement Windows.
> Electron rejoue la même interface sur Linux avec le même moteur de rendu.

## Fonctionnalités

- Démarrage sur **Admin** (`admin.care-planner.org`)
- Barre : `←  →  ⟳  ⌂   [ onglets … + ]`  puis les 7 raccourcis d'écosystème :
  Admin · CRM · Formation · Aide · Présentation · **Site web** (icône globe) · **Mobile** (icône smartphone)
- Onglets colorés selon le module ouvert
- Session partagée entre onglets et sous-domaines (`partition: persist:careplanner`)
- Liens externes ouverts dans le navigateur système ; sous-domaines `*.care-planner.org` en nouvel onglet
- Raccourcis : `Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`, `F5`, `Alt+←/→`, `Alt+Home`

## ⚠️ Partage de session entre sous-domaines

Comme sous Windows, le cookie de session doit être posé sur le domaine parent,
côté PHP :

```php
session_set_cookie_params(['domain' => '.care-planner.org']);
```
ou, dans `php.ini` : `session.cookie_domain = .care-planner.org`

## Compiler SANS rien installer (recommandé)

1. Pousser ce dossier dans un **nouveau dépôt GitHub**.
2. Onglet **Actions** → lancer « Build Eco-système (Linux, Electron) » (*Run workflow*),
   ou pousser un tag `v1.0.0`.
3. Récupérer les paquets dans les artefacts du build :
   - `EcoSysteme-1.0.0.AppImage` — portable, double-clic, aucune installation
   - `EcoSysteme-1.0.0.deb` — installation Debian/Ubuntu

## Installer / lancer

- **AppImage** : `chmod +x EcoSysteme-1.0.0.AppImage` puis double-clic.
  Sur certaines distributions il faut `libfuse2` (`sudo apt install libfuse2`),
  ou lancer avec `./EcoSysteme-1.0.0.AppImage --appimage-extract-and-run`.
- **.deb** : `sudo apt install ./EcoSysteme-1.0.0.deb`

## Compiler en local (optionnel)

Prérequis : Node.js 20+.

```bash
npm install
npm run dist          # produit dist/*.AppImage et dist/*.deb
npm start             # lance l'appli sans empaqueter (test)
```

## Ajouter le format Fedora/openSUSE (.rpm)

Dans `package.json`, ajouter `"rpm"` à `build.linux.target`, et dans le
workflow installer `rpm` : `sudo apt-get install -y rpm`.

## Personnalisation

- **Destinations / couleurs / icônes** : tableau `ECO` en haut de `renderer/renderer.js`
- **Page d'accueil** : constante `HOME` dans `renderer/renderer.js`
- **Logo** : `renderer/careplanner.png` (barre/onglets, recoloré en blanc par CSS) et `build/icon.png` (icône de l'appli)
- **Éditeur / nom** : `package.json` (`author`, `productName`, `build.linux.maintainer`)

## Structure

```
main.js                         Processus principal (fenêtre, menu, routage des liens)
preload.js                      Pont sécurisé renderer ↔ principal
renderer/index.html             Barre + zone des onglets
renderer/styles.css             Apparence (identique à la version Windows)
renderer/renderer.js            Onglets, navigation, écosystème, couleurs
renderer/careplanner.png        Logo (barre / onglets)
build/icon.png                  Icône de l'application
package.json                    Dépendances + configuration electron-builder
.github/workflows/build-linux.yml  Compilation automatique (AppImage + .deb)
```
