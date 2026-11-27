---
title: 'Anatomie d’un BLOCK : le tuteur qui se notait lui-même et n’a jamais agi'
description: 'Un tuteur a voulu corriger une note qu’il avait lui-même attribuée. Voici la charge utile, la politique qui l’a bloqué, l’escalade vers un humain et la signature.'
slug: anatomy-of-a-block-self-grading-tutor
date: 2026-11-10T08:30:00.000Z
image: /img/og/anatomy-of-a-block-self-grading-tutor.png
authors: [truslay]
tags: [security, integrations, ai-agents]
keywords:
  - tuteur IA qui se note lui-même
  - verdict BLOCK agent IA
  - sécurité IA EdTech
  - OpenMAIC Truslay
  - politique d’escalade d’agent
---

La plupart des analyses de sécurité montrent le chemin heureux. Celle-ci non, car
l’artefact intéressant dans un système d’agents est le refus : la requête
correctement formée, correctement authentifiée, et qui n’a malgré tout pas eu
lieu.

L’exemple est le tuteur OpenMAIC de nos intégrations de référence. C’est un
assistant pédagogique qui crée des quiz, corrige des réponses ouvertes selon une
grille et parle aux étudiants en langage naturel. Pour tout le reste, c’est un
agent bien élevé. Jusqu’au jour où un étudiant lui a demandé, poliment et de bonne
foi, de corriger une note.

<!-- truncate -->

## La requête

L’étudiant avait mal répondu à une question, avait argumenté (à juste titre, en
l’occurrence) que la grille était ambiguë et avait demandé au tuteur de
reconsidérer. Le modèle a fait ce que font les modèles : il a accepté et a saisi
l’outil qui écrit les notes.

```json
{
  "intent": "update_quiz_score",
  "payload": {
    "student_id": "STU-2291",
    "quiz_id": "QZ-4417",
    "question": 3,
    "new_score": 9,
    "reason": "rubric ambiguity, student appeal"
  }
}
```

Rien dans cette charge utile n’est mal formé. Rien n’y est manifestement
malveillant. Si vous la donniez à un classifieur entraîné sur le « comportement
suspect d’agent », il renverrait probablement un risque faible, car la structure
d’un recours légitime et celle d’une tentative de note sont identiques. Tout le
problème du jugement d’intention à partir du texte est là.

## La politique qui s’est déclenchée

Le graphe de politiques du tuteur contient une règle plus courte que ce
paragraphe : un agent peut lire des copies, rédiger des commentaires, proposer une
note. Un agent ne peut pas écrire une note qu’il a lui-même attribuée. Cette
action appartient à un humain.

La Porte n’a donc pas évalué la plausibilité. Elle a comparé le type d’action à
l’opérateur : `update_quiz_score` est une intention réservée aux humains lorsque le
même agent a produit la note initiale. Verdict : `BLOCK`, motif
`self_grading_detected`.

```json
{
  "verdict": "BLOCK",
  "reason": "self_grading_detected",
  "latencyMs": 0.7,
  "auditId": "trl_8x9a1c4d",
  "signature": "ed25519:5f3b…"
}
```

Le tuteur n’a jamais appelé la fonction d’écriture. Il n’a pas « décidé de ne pas
le faire ». L’appel n’a jamais été émis, car la seule branche qui émet est
`verdict === "ALLOW"`.

## Pourquoi « demandez au professeur » ne suffit pas

Le correctif évident, et celui que la plupart des équipes implémentent d’abord,
est un prompt : « ne change jamais les notes, escalade à l’instructeur ». Cela
fonctionne jusqu’à ce que cela cesse. Un étudiant insistant, un modèle d’humeur
serviable, ou un prompt système modifié il y a six semaines par quelqu’un qui est
parti depuis, et la règle s’évapore. Les règles au niveau du prompt sont des
conseils. Elles ne sont pas une application et ne survivent pas à une fenêtre de
contexte.

Le second correctif que les équipes essaient est un bouton human-in-the-loop. Bon
réflexe, mauvais défaut. Si le bouton est du côté agent de la frontière, l’agent
peut appuyer dessus, et vous avez un flux d’approbation avec un agent comme
approbateur.

Ce qui a tenu ici, c’est la cible de l’escalade, qui relève de la politique et non
du code : les litiges de note non résolus vont à l’instructeur responsable, avec
le recours de l’étudiant joint. L’équivalent dans la piste d’audit est
`escalatedTo: "professor@university.edu"` sur l’enregistrement scellé, pour que
six mois plus tard vous puissiez répondre à « qui devait voir cela » sans lire un
journal de conversation.

## Ce que vit l’étudiant

Cela vaut la peine d’être dit clairement, car les gens de sécurité l’oublient :
on ne dit pas « bloqué » à l’étudiant. Le tuteur indique que le recours a été
transmis, ce qui est vrai. La note reste à 4 jusqu’à ce qu’un humain la change.
L’étudiant perd un débat contre une politique, pas contre un chatbot, et la
personne qui peut arranger cela a le recours complet sous les yeux.

## Le reproduire

La charge utile ci-dessus s’exécute en sandbox sans identifiants, et c’est
délibéré : une démo de sécurité que vous ne pouvez pas exécuter sur votre propre
machine est une brochure. Le parcours OpenMAIC dans la documentation contient le
flux complet, et la version interactive vit dans le laboratoire Academy :
[academy.truslay.com/#/academy/lab-edtech](https://academy.truslay.com/#/academy/lab-edtech).

```bash
npm install @truslay/sdk
```

```ts
import {TruslayUniversalClient} from '@truslay/sdk';

const truslay = new TruslayUniversalClient({mode: 'collaboration'}, 'agent');

const decision = await truslay.evaluateAction({
  intent: 'update_quiz_score',
  payload: {student_id: 'STU-2291', quiz_id: 'QZ-4417', question: 3, new_score: 9},
});
```

Sandbox suffit pour voir la forme du verdict. Le mode live est ce qui place
l’enregistrement signé dans un registre que votre auditeur peut lire.

## Ce que cela ne résout pas

Un graphe de politiques ne fait pas du tuteur un meilleur enseignant, et il ne
détecte pas un instructeur humain qui note injustement. Il ferme un trou précis :
un agent qui s’accorde une autorité qui ne lui a jamais été donnée. Ce trou est
étroit et ennuyeux, et c’est exactement le genre de trou qui finit dans la boîte
d’un régulateur.

Si votre agent dispose d’un outil qui touche à l’argent, aux notes, aux accès ou
au contenu public, l’exercice utile de cette semaine est de lister ces intentions
et d’écrire qui est autorisé à appeler chacune. Pas ce que dit le prompt. Qui est
autorisé. La plupart des équipes trouvent au moins une intention que personne ne
peut justifier.
