---
title: 'Douze questions à poser avant d’acheter une sécurité IA fail-closed'
description: 'Les questions d’évaluation que nous poserions à un concurrent, avec la réponse qui doit vous inquiéter et celle qui ne doit pas. Utile que vous nous choisissiez ou non.'
slug: questions-to-ask-a-fail-closed-vendor
date: 2026-09-30T08:00:00.000Z
image: /img/og/questions-to-ask-a-fail-closed-vendor.png
authors: [truslay]
tags: [security, architecture]
keywords:
  - évaluer un fournisseur de sécurité IA
  - checklist garde-fous fail-closed
  - achat de sécurité pour agents IA
  - questions aux fournisseurs de garde-fous
---

Nous vendons cette catégorie, alors traitez cette liste avec la méfiance qui
s’impose. C’est malgré tout la liste que nous utilisons en interne lorsque nous
examinons des produits adjacents, et chaque question ci-dessous a une réponse qui
nous ferait partir.

<!-- truncate -->

## Application

### 1. Où la décision se produit-elle physiquement ?

La bonne réponse nomme un processus, une frontière et ce qui se passe sans
réseau. « Dans notre cloud, avec 40 ms p99 » est une excellente réponse pour un
autre produit. Si l’application est à un saut de l’agent, l’appel d’outil est à un
saut d’avoir lieu sans elle.

### 2. Que se passe-t-il quand le service de décision est indisponible ?

Écoutez « échoue ouvert », « se dégrade gracieusement », « cache avec TTL ». Un
`ALLOW` en cache est un `ALLOW` que vous n’avez pas mérité. La réponse attendue
est un verdict, pas une politique de reprise : injoignable signifie `BLOCK`.

### 3. Un verdict peut-il être contourné par l’agent ?

Cela doit être impossible par construction, pas par convention. Demandez à voir
le chemin de code où l’outil est invoqué et confirmez que la seule branche qui y
mène est celle de `ALLOW`. « On demande au modèle de ne pas le faire » n’est pas
un contrôle de contournement.

### 4. `REVIEW` est-il réellement bloqué ?

Beaucoup de produits traitent la revue comme une autorisation souple avec
notification. Demandez ce que fait l’agent pendant qu’un humain réfléchit. Si la
réponse est « il continue avec un périmètre réduit », vous avez acheté un système
de logs avec des étapes en plus.

### 5. Quelle est l’unité déterministe ?

Insistez sur l’objet versionné et testable : un graphe de politiques, un jeu de
règles, un bundle signé. Si la réponse est « notre modèle », vous ne pouvez pas
écrire de test de non-régression pour une décision de sécurité, et votre auditeur
non plus.

## Preuves

### 6. Que contient exactement l’enregistrement d’audit ?

L’enregistrement doit permettre de reconstruire la décision un an plus tard :
intention, charge utile, version de la politique, verdict, motif, horodatage et
qui a résolu une revue. Demandez un enregistrement d’exemple, pas une capture
d’écran de tableau de bord.

### 7. L’enregistrement est-il signé, et avec la clé de qui ?

Signé par le composant qui a pris la décision, avec une clé que le client peut
vérifier et, idéalement, détenir. Le hachage d’un fichier de log prouve que le
fichier n’a pas changé après le hachage ; il ne prouve pas son contenu.

### 8. Un administrateur peut-il modifier ou supprimer des enregistrements ?

La bonne réponse inclut un mécanisme hors du contrôle de l’administrateur :
ancrage, horodatage externe, stockage write-once. Si « immuable » est une
permission de base de données, c’est une politique, et les politiques changent
pendant les incidents.

### 9. La cryptographie a-t-elle été revue par quelqu’un qui ne travaille pas chez vous ?

C’est ici que vous demandez un audit tiers, et que vous devez vous méfier du mot
« prévu ». Demandez le périmètre, le cabinet et la date du rapport. Un audit en
cours est une réponse légitime tant qu’il est présenté comme tel ; une
affirmation de réussite sans rapport ne l’est pas.

## Exploitation

### 10. Que nécessite un changement de politique ?

Versionnement, revue et un moyen de répondre à « quelle politique était active
quand cette décision a été prise ». Si changer un seuil est une modification de
champ dans un tableau de bord, cette modification est un changement de votre
posture de sécurité et exige la même traçabilité.

### 11. Peut-il tourner dans notre périmètre, et qu’est-ce qui appelle encore la maison ?

Demandez la liste des sorties, par écrit, par mode de déploiement. Puis testez :
débranchez, lancez la suite, observez ce qui se dégrade. L’écart entre le document
et le comportement est la vraie réponse.

### 12. Quel est le coût des faux positifs, mesuré ?

Tout système fail-closed bloque quelque chose de légitime. Le fournisseur doit
connaître le taux, les trois causes principales et le chemin qu’un humain suit
pour débloquer une opération réelle à 2 h du matin. Si personne ne l’a mesuré,
c’est vous qui le mesurerez.

## Comment utiliser cette liste

Ne l’envoyez pas comme un questionnaire ; tous les fournisseurs répondront « oui »
aux douze. Exécutez les questions 2, 3, 8 et 11 comme des tests pendant une
évaluation, sur votre propre charge de travail et avec vos propres politiques. Le
reste sert à la conversation d’après, quand vous savez déjà quelles réponses
étaient vraies.

Si vous voulez lancer les tests contre Truslay d’abord, le
[démarrage rapide](https://docs.truslay.com/docs/introduction/quick-start)
fonctionne hors ligne, et le
[guide sur site](https://docs.truslay.com/docs/security/on-premise-deployment)
couvre les questions de déploiement. Ramenez-nous les échecs ; ils sont plus
utiles que les compliments.
