---
title: 'Un verdict n’est pas une probabilité : pourquoi nous avons supprimé le score'
description: 'Les garde-fous probabilistes vous donnent un nombre en espérant que vous avez choisi le bon seuil. Un graphe de politiques renvoie ALLOW, REVIEW ou BLOCK, et peut le prouver.'
slug: deterministic-verdicts-not-probability
date: 2026-11-18T09:00:00.000Z
image: /img/og/deterministic-verdicts-not-probability.png
authors: [truslay]
tags: [architecture, security]
keywords:
  - garde-fous IA déterministes
  - agents IA fail-closed
  - évaluation par graphe de politiques
  - sécurité des appels d’outils
  - verdict ALLOW REVIEW BLOCK
---

La première version interne de Truslay renvoyait un score. Entre 0 et 1, plus haut
signifiant plus risqué, avec une doc d’intégration qui disait « bloquez au-delà de
0,7, révisez entre 0,4 et 0,7 ». Nous l’avons fait tourner sur quatre flux d’agents
pendant un mois. Puis nous l’avons supprimé, et personne dans l’équipe ne le
regrette.

La raison honnête est celle-ci. Chaque fois que le score tombait à 0,62, deux
personnes de l’appel n’étaient pas d’accord, discrètement, sur la suite à donner,
et aucune des deux n’avait tort. Le nombre n’avait pas tort non plus. Ce n’était
simplement pas une décision.

<!-- truncate -->

## Un seuil est une politique que vous ne pouvez pas lire

Quand un classifieur renvoie 0,62, vous avez une conjecture compressée sur une
distribution d’exemples passés. Le seuil que vous posez dessus est une seconde
conjecture, faite une fois, généralement pendant une démo, et presque jamais
écrite là où un relecteur sécurité pourrait la trouver.

Ce n’est pas une attaque contre les classifieurs. Nous en utilisons. Ils excellent
à répondre à « ce texte ressemble-t-il à une demande de remboursement ». Ils sont
mauvais à répondre à « cet agent peut-il sortir 4 190 € de ce compte maintenant »,
car la seconde question porte sur une permission, pas sur une ressemblance avec du
texte passé.

Une permission a une structure. Un remboursement a un montant, une devise, un
client, un demandeur, une fenêtre temporelle et une personne responsable en cas de
problème. Une fois cela écrit, la décision cesse d’être une question de goût.

## Ce qui revient à la place

Le SDK renvoie l’un de trois verdicts par action : `ALLOW`, `REVIEW`, `BLOCK`.
Rien d’autre, aucun score à interpréter.

```ts
import {TruslayUniversalClient} from '@truslay/sdk';

const truslay = new TruslayUniversalClient(
  {mode: 'collaboration', firewallMode: 'live', apiKey: process.env.TRUSLAY_API_KEY},
  'agent',
);

const decision = await truslay.evaluateAction({
  intent: 'issue_refund',
  payload: {amount: 4190, currency: 'EUR', customer_id: 'CUS-8841'},
});

if (decision.verdict !== 'ALLOW') {
  throw new Error(`Blocked by Truslay: ${decision.reason}`);
}
```

L’enveloppe porte plus que le mot : un `reason` lisible par machine, un
`latencyMs` mesuré sur votre machine, un `auditId` pour l’enregistrement scellé et
une `signature` produite par la couche Seal. Un remboursement au-delà du plafond
revient en `BLOCK` avec `reason: "policy_denied"`, et le montant est dans le chemin
du code de motif, pas enfoui dans un float.

## Trois propriétés, et pourquoi chacune est testable

**Déterminisme.** Même intention, même charge utile, même graphe de politiques,
même verdict. Pas « généralement le même ». Cela compte plus qu’il n’y paraît :
vous pouvez écrire un test de non-régression pour une décision de sécurité, en CI,
sans modèle dans la boucle.

**Fail-closed.** Si la décision ne peut pas être produite, rien ne s’exécute. Un
Firewall live qui expire renvoie `BLOCK` avec `firewall_unavailable`. Une réponse
mal formée est traitée comme un refus. Il n’y a pas de branche fail-open à
configurer par accident.

**Preuve.** Un verdict est signé et ajouté à un registre, et la racine du registre
est ancrée pour être vérifiable plus tard. Une ligne de log dit ce qu’un processus
a imprimé. Ceci dit ce qui a été décidé, pour quelle charge utile et à quel moment,
sous une forme qui ne change pas discrètement.

## Les classifieurs gardent leur place

Je veux être prudent ici, car « déterministe » se vend comme « aucun ML nulle
part », et ce n’est pas notre position.

Un classifieur est une bonne *entrée* pour un graphe de politiques. « Ce ticket
contient-il une menace d’auto-agression » est une question réellement floue, et un
modèle y répond mieux que n’importe quelle règle que j’écrirais. Le geste important
est ce qu’il advient de cette réponse : elle devient un signal que le graphe lit,
et le graphe décide. Le modèle propose, la Porte dispose. Si le modèle est
indisponible ou renvoie quelque chose hors de son contrat, le graphe route vers
`REVIEW`, ce qui signifie toujours que l’appel n’a pas lieu.

Ce que nous avons retiré n’est pas le modèle. C’est l’autorité du modèle à avoir le
dernier mot.

## Ce que cela vous coûte

Deux choses, et aucune n’est petite.

Vous devez écrire de la politique. Pas des prompts, de la politique : plafonds,
rôles, cibles d’escalade, segments de clients. Quelqu’un qui comprend le métier
doit s’asseoir avec quelqu’un qui comprend l’agent, et cette réunion est le
produit. Nous ne pouvons pas la générer à partir de vos logs, et les fournisseurs
qui prétendent le contraire vous vendent un seuil avec des étapes en plus.

Et vous perdez l’ambiguïté confortable d’un score. Quand le verdict est `BLOCK`
parce qu’un agent a tenté de changer une note qu’il avait attribuée, il n’y a pas
de « bon, 0,68, on est passé près ». Il y a une décision, un code de motif et une
personne vers qui escalader. Certaines équipes trouvent cela inconfortable pendant
une semaine. Ensuite elles trouvent que c’est la seule façon de dormir.

## Les questions que l’on nous pose chaque semaine

### N’est-ce pas juste un moteur de règles ?

Non, mais la différence est plus étroite que les fournisseurs le laissent
entendre. Un moteur de règles évalue des conditions que vous avez écrites à
l’avance ; le graphe de politiques porte aussi le plan d’exécution : quelle couche
évalue quoi, ce qui se passe quand une couche est indisponible et comment la
décision est scellée. Le déterminisme vient du graphe, pas de l’absence de logique.

### Et l’injection de prompt et la dérive ?

L’injection est précisément le cas où un score échoue. L’instruction injectée
ressemble souvent *plus* à une requête légitime que la vraie, donc un modèle de
similarité l’apprécie. Un graphe se moque de la plausibilité du texte ; il vérifie
si cet agent peut accomplir cette action avec cette charge utile. La dérive du
comportement du modèle est réelle, et c’est pourquoi le point d’application se
situe entre le modèle et l’outil, pas dans le modèle.

### Cela ajoute-t-il de la latence ?

Les couches 1 à 6 s’exécutent en processus et hors ligne ; la documentation cite
des décisions sous la milliseconde, et le champ `latencyMs` vous permet de le
vérifier sur votre propre matériel plutôt que de nous croire. Les couches 7 et 8
impliquent le Firewall et coûtent un aller-retour réseau, et c’est pourquoi le mode
live est un choix délibéré et non le défaut.

Si vous voulez voir la différence sur votre propre agent, le
[démarrage rapide](https://docs.truslay.com/docs/introduction/quick-start) tourne
en sandbox sans identifiants, et le
[contrat de verdict](https://docs.truslay.com/docs/api-reference/verdicts) couvre
chaque code de motif. Commencez par là avant de parler à qui que ce soit, nous
compris.
