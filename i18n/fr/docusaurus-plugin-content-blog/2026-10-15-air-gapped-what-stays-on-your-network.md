---
title: 'Ce qui sort réellement de votre réseau quand vous exécutez Truslay'
description: 'Ce qui sort de votre réseau quand Truslay tourne air-gapped : rien en sandbox. Voici ce que chaque mode envoie, et ce que l’isolation ne corrige pas.'
slug: air-gapped-what-stays-on-your-network
date: 2026-10-15T09:15:00.000Z
image: /img/og/air-gapped-what-stays-on-your-network.png
authors: [truslay]
tags: [deployment, security, architecture]
keywords:
  - sécurité IA air-gapped
  - firewall d’agents IA sur site
  - infrastructure IA souveraine
  - résidence des données agents IA
  - évaluation de politiques hors ligne
---

La question d’achat n’est jamais « est-ce sûr ? ». C’est « qu’est-ce qui sort de
notre réseau, et pouvez-vous me le montrer ? ». Question légitime, et à laquelle
la plupart des fournisseurs de sécurité IA répondent par un schéma
d’architecture et un paragraphe sur le chiffrement en transit.

Voici donc la version moins flatteuse et plus utile : un décompte par mode de ce
qui va où, y compris le cas où la réponse est « rien ».

<!-- truncate -->

## Sandbox : rien ne franchit la frontière

Sandbox est le mode par défaut. `firewallMode` n’est simplement pas défini et le
SDK évalue localement : intention en entrée, verdict en sortie, aucune socket
ouverte.

Ce n’est pas un mode démo qui fait semblant de fonctionner. C’est le même chemin
d’évaluation que la production, moins les étapes de corroboration, et c’est
pourquoi c’est le bon endroit pour la CI. Votre pipeline obtient des verdicts
déterministes à chaque commit, sans identifiants, sans compte fournisseur et sans
règle de sortie à maintenir.

```bash
# CI air-gapped : aucune interface réseau nécessaire pour les couches 1 à 6.
npm install @truslay/sdk
npm test
```

```ts
const decision = await truslay.evaluateAction({
  intent: 'delete_customer_record',
  payload: {customer_id: 'CUS-1042'},
});
// {verdict: 'BLOCK', reason: 'policy_denied', latencyMs: 0.6, …}
```

## Live : un endpoint, et c’est vous qui choisissez où il vit

En mode live, le SDK envoie l’intention structurée et la charge utile au Firewall,
et le Firewall renvoie une décision. C’est tout le schéma de trafic des couches 7
et 8. Aucun historique de prompts, aucun poids de modèle, aucun document de votre
corpus. Le SDK ne les a jamais eus : Signal a capturé l’intention, pas la
conversation.

Et le Firewall est un déployable, pas un endpoint multi-locataires auquel il faut
faire confiance. Le guide sur site décrit son exécution dans votre propre
périmètre, ce qui transforme la relation fournisseur en artefact versionné que
vous installez et mettez à jour à votre rythme. Si votre exigence est « le
composant qui décide est derrière notre frontière », c’est la configuration à
demander, et celle à tester pendant une évaluation plutôt qu’après signature.

| Mode | Ce qui franchit la frontière | Où la décision est produite |
| --- | --- | --- |
| Sandbox | Rien | En processus, couches 1–6 |
| Live, Firewall hébergé | Intention + charge utile | Firewall, couches 4–8 |
| Live, Firewall sur site | Intention + charge utile, dans votre réseau | Votre périmètre, couches 4–8 |
| Anchor | Hachage de racine du registre | Là où vous pointez l’ancrage |

## Le test que je ferais avant de croire tout cela

Débranchez le réseau. Lancez la suite sandbox. Si les verdicts reviennent avec des
latences inférieures à la milliseconde et des enveloppes signées, l’affirmation
locale est vraie pour votre charge de travail, pas seulement pour la nôtre.
Rétablissez ensuite le réseau, retirez l’URL du Firewall en mode live et regardez :
ce doit être `BLOCK` avec `firewall_unavailable`, pas un timeout suivi d’un
repli permissif.

Ce second test sépare un produit fail-closed d’une diapositive fail-closed. Nous
avons connu des salles où la réponse était « nous nous dégradons gracieusement »,
ce qui signifie en pratique que l’appel d’outil s’exécute.

## Ce que l’isolation ne vous apporte pas

Quatre choses, car la liste honnête est courte et les gens planifient autour de la
mauvaise.

**Elle ne supprime pas le travail de politique.** Quelqu’un doit encore décider
que les changements de notes appartiennent aux humains et que les remboursements
au-delà de 2 000 € exigent un second regard. Une installation air-gapped avec un
graphe de politiques vague est une façon coûteuse de tout autoriser.

**Elle ne rend pas la revue confortable en asynchrone.** Prism résout les verdicts
`REVIEW` avec des humains. Si ces humains sont dans une autre zone réseau, la file
franchit une frontière que vous venez de fermer ; planifiez le chemin humain avec
le même soin que le chemin des données.

**Elle ne règle pas la gestion des clés.** La couche Seal signe avec une clé.
Air-gapped signifie que vous détenez cette clé, donc que vous la renouvelez, la
sauvegardez et pouvez expliquer où elle était à 3 h du matin le trimestre dernier.

**Elle ne remplace pas vos contrôles existants.** Truslay se place entre l’agent
et l’outil. Votre IAM, vos droits de base de données et votre politique réseau
continuent de faire leur travail ; cela ferme le trou où un agent autonome muni
d’identifiants valides fait quelque chose de parfaitement autorisé et de
totalement faux.

Si vous voulez dérouler la vraie checklist plutôt que la lire, le
[guide de déploiement sur site](https://docs.truslay.com/docs/security/on-premise-deployment)
contient les étapes ordonnées, les ports et ce qu’il faut vérifier après chacune.
Apportez-le à votre équipe sécurité avant d’apporter une présentation de
fournisseur.
