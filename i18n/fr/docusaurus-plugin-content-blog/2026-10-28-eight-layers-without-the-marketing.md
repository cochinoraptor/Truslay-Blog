---
title: 'Les 8 couches, expliquées sans le marketing'
description: 'Signal, Lattice, Shield, Gate, Seal, Ledger, Anchor, Prism : une par mode de défaillance, où finit le SDK et où commence le Firewall, et quand 8 est excessif.'
slug: eight-layers-without-the-marketing
date: 2026-10-28T10:00:00.000Z
image: /img/og/eight-layers-without-the-marketing.png
authors: [truslay]
tags: [architecture]
keywords:
  - Truslay 8 couches
  - architecture de sécurité pour agents IA
  - SDK vs firewall
  - interception d’intention
  - registre d’audit immuable
---

Huit est un nombre suspect. Quand un produit de sécurité présente une pile
numérotée, le compte correspond en général à ce qui tenait sur la diapositive. Le
nôtre est huit parce qu’il existe huit façons distinctes dont une action d’agent
peut être fausse, et en fusionner deux revient à en laisser une sans traitement. Je
vais essayer de montrer les coutures plutôt que de les cacher.

<!-- truncate -->

## Couches 1 à 6 : le SDK, dans votre processus

Elles s’exécutent dans le Sovereign Edge, qui est un paquet npm. Pas de réseau,
pas de compte, pas d’aller-retour. Si vous débranchez la machine, les couches 1 à
6 décident toujours.

**1. Signal — intercepter l’intention.** La couche qui compte vraiment, et celle
que l’on saute dans les schémas. Avant toute politique, le SDK capture ce que
l’agent s’apprête à faire sous forme d’intention structurée et de charge utile, et
non de prose. Si vous ne pouvez pas nommer l’intention, vous ne pouvez pas avoir
de politique à son sujet.

**2. Lattice — charger le graphe de politiques.** Les politiques sont un graphe de
conditions avec un ordre d’évaluation explicite, versionné et figé. Figé compte :
une évaluation qui a utilisé la version 14 de la politique il y a six mois doit
rester explicable aujourd’hui.

**3. Shield — normaliser et valider la charge utile.** Contrôles de type, plages,
champs requis et les attaques ennuyeuses : montants démesurés, identifiants client
manquants, codes de devise inexistants. Une charge utile qui échoue à la
validation ne peut pas produire `ALLOW`.

**4. Gate — décider, fail-closed.** La décision à trois verdicts décrite dans
[le contrat de verdict](https://docs.truslay.com/docs/api-reference/verdicts).
`ALLOW` est la seule valeur qui laisse passer l’appel ; `REVIEW` et `BLOCK`
l’arrêtent.

**5. Seal — signer la décision.** Ed25519 sur la décision et ses entrées, pour que
l’enregistrement soit vérifiable sans faire confiance au service qui l’a écrit.

**6. Ledger — ajouter, jamais modifier.** Les décisions entrent dans une structure
append-only. Vous pouvez ajouter ; vous ne pouvez pas réécrire discrètement le
mardi dernier.

## Couches 7 et 8 : le Firewall, dans votre périmètre

La frontière entre le SDK et le Firewall est celle entre *décider* et
*corroborer*. C’est là que le marketing devient vague, alors voici la version
simple.

**7. Anchor — ancrer la racine du registre.** La racine de hachage du registre est
écrite quelque part que vous ne contrôlez pas exclusivement, afin qu’une
modification ultérieure de l’histoire locale soit détectable. C’est la couche qui
donne à « immuable » un sens autre que « nous le promettons ».

**8. Prism — résoudre ce qu’une machine ne devrait pas décider.** Les cas ambigus
arrivent ici pour un humain : la piste d’audit, la file de revue, la double
approbation et la résolution, elle-même enregistrée comme une nouvelle décision
signée. Prism n’est pas un tableau de bord ajouté par-dessus ; c’est là que
`REVIEW` devient le nom d’une personne.

Les couches 7 et 8 nécessitent le Firewall, donc un appel réseau, et c’est
pourquoi le mode live n’est pas le défaut. En live, un Firewall injoignable donne
`BLOCK` avec `firewall_unavailable`. Gênant pour les tableaux de bord d’uptime.
Correct pour les permissions.

## Le tableau que je mettrais sur la diapositive

| Couche | Rôle | Défaillance qu’elle ferme |
| --- | --- | --- |
| Signal | Capturer l’intention structurée | L’agent agit sur une prose que personne ne peut inspecter |
| Lattice | Charger le graphe de politiques figé | Des règles qui dérivent entre déploiements |
| Shield | Valider la charge utile | Entrées mal formées ou hors plage |
| Gate | Décider, fail-closed | Replis fail-open, « avertissements » consultatifs |
| Seal | Signer la décision | Décisions altérées après coup |
| Ledger | Enregistrement append-only | Logs supprimés ou réécrits |
| Anchor | Ancrer la racine | Histoire locale modifiée en bloc |
| Prism | Résolution humaine | Cas ambigus décidés par une machine |

## Où la séparation fait réellement mal

Compromis honnête : le SDK fonctionne sans le Firewall, donc une équipe peut
adopter les couches 1 à 6 en un après-midi et se sentir prête. Elle a
l’application, mais pas l’ancrage ni de chemin de résolution humaine, et ce sont
précisément les deux sujets des auditeurs. L’écart est réel et nous ne le cachons
pas : il se voit dans le champ `signature`, présent quand Seal s’est exécuté
localement, et dans le fait que la racine du registre soit ancrée ou non.

L’inverse est vrai aussi. Si vous n’exécutez que le Firewall sans le SDK, vous
inspectez le trafic après que l’agent a déjà formé l’intention, et vous perdez la
propriété locale inférieure à la milliseconde. La séparation n’est pas
décorative ; chaque moitié échoue différemment.

## Où c’est excessif

Si votre agent rédige des e-mails qu’un humain envoie, vous n’avez pas besoin de
huit couches. Vous avez besoin d’une file de revue et d’un café. La pile gagne sa
place dès que l’agent touche quelque chose de coûteux ou d’irréversible : argent,
notes, attribution d’accès, publication publique, suppression de données de
production. Ce sont les intentions où « il se comporte bien d’habitude » n’est pas
une réponse à donner à un conseil d’administration.

La pile complète, avec les responsabilités exactes de chaque couche et son
comportement en cas d’échec, se trouve dans
[la documentation d’architecture](https://docs.truslay.com/docs/architecture/the-8-layers).
Commencez par là si vous voulez la version avec schémas ; cet article est la
version pour ceux qui doivent défendre la conception en réunion.
