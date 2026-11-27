---
title: 'Anatomía de un BLOCK: el tutor que se calificaba a sí mismo y nunca llegó a ejecutarse'
description: 'Un tutor intentó corregir una nota que él mismo había puesto. Aquí están la carga útil, la política que lo bloqueó, el escalado a una persona y la firma.'
slug: anatomy-of-a-block-self-grading-tutor
date: 2026-11-10T08:30:00.000Z
image: /img/og/anatomy-of-a-block-self-grading-tutor.png
authors: [truslay]
tags: [security, integrations, ai-agents]
keywords:
  - tutor de IA que se autocalifica
  - veredicto BLOCK en agentes de IA
  - seguridad de IA en EdTech
  - OpenMAIC Truslay
  - política de escalado de agentes
---

Casi todos los análisis de seguridad muestran el camino feliz. Este no, porque el
artefacto interesante en un sistema de agentes es la denegación: la petición que
estaba bien formada, bien autenticada y aun así no ocurrió.

El ejemplo es el tutor de OpenMAIC de nuestras integraciones de referencia. Es un
asistente docente que crea cuestionarios, corrige respuestas abiertas con una
rúbrica y habla con los estudiantes en lenguaje natural. En todo lo demás es un
agente bien educado. Hasta que un estudiante le pidió, con educación y buena fe,
que le corrigiera una nota.

<!-- truncate -->

## La petición

El estudiante había respondido mal a una pregunta, argumentó (correctamente, todo
sea dicho) que la rúbrica era ambigua y pidió al tutor que lo reconsiderara. El
modelo hizo lo que hacen los modelos: estuvo de acuerdo y echó mano de la
herramienta que escribe puntuaciones.

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

Nada en esa carga útil está mal formado. Nada en ella es obviamente malicioso. Si
se la dieras a un clasificador entrenado con «comportamiento sospechoso de
agente», probablemente devolvería riesgo bajo, porque la estructura de una
apelación legítima y la de un intento de robar nota son idénticas. Ese es todo el
problema de juzgar la intención a partir del texto.

## La política que se activó

El grafo de políticas del tutor tiene una regla más corta que este párrafo: un
agente puede leer entregas, puede redactar comentarios, puede proponer una nota.
Un agente no puede escribir una nota que él mismo asignó. Esa acción pertenece a
una persona.

Así que la Compuerta no evaluó la plausibilidad. Comprobó el tipo de acción contra
el operador: `update_quiz_score` es una intención reservada a humanos cuando el
mismo agente produjo la marca original. Veredicto: `BLOCK`, motivo
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

El tutor nunca llamó a la función de escritura. No «decidió no hacerlo». La
llamada nunca se despachó, porque la única rama que despacha es
`verdict === "ALLOW"`.

## Por qué «preguntar al profesor» no basta

El arreglo obvio, y el que la mayoría de los equipos implementa primero, es un
prompt: «nunca cambies notas, escala al instructor». Funciona hasta que deja de
funcionar. Un estudiante persistente, un modelo en vena servicial o un prompt de
sistema editado hace seis semanas por alguien que ya se fue, y la regla se
evapora. Las reglas a nivel de prompt son consejos. No son aplicación y no
sobreviven a una ventana de contexto.

El segundo arreglo que prueban los equipos es un botón de human-in-the-loop. Buen
instinto, mal valor por defecto. Si el botón está del lado del agente en la
frontera, el agente puede pulsarlo, y ahora tienes un flujo de aprobación con un
agente como aprobador.

Lo que sí aguantó aquí fue el destino del escalado, que es política, no código:
las disputas de notas sin resolver van al instructor responsable, con la apelación
del estudiante adjunta. El equivalente en la pista de auditoría es
`escalatedTo: "professor@university.edu"` en el registro sellado, para que seis
meses después puedas responder «quién debía ver esto» sin leer un log de chat.

## Lo que experimenta el estudiante

Merece decirlo claramente, porque el personal de seguridad lo olvida: al
estudiante no se le dice «bloqueado». El tutor dice que la apelación se ha
reenviado, que es cierto. La nota sigue en 4 hasta que una persona la cambie. El
estudiante pierde una discusión contra una política, no contra un chatbot, y la
persona que puede arreglarlo tiene la apelación completa delante.

## Reproducirlo

La carga útil de arriba se ejecuta en sandbox sin credenciales, y es deliberado:
una demo de seguridad que no puedes ejecutar en tu propia máquina es un folleto.
El recorrido de OpenMAIC en la documentación tiene el flujo completo, y la versión
interactiva vive en el laboratorio de Academy en
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

Sandbox basta para ver la forma del veredicto. El modo live es lo que pone el
registro firmado en un libro que tu auditor puede leer.

## Lo que esto no resuelve

Un grafo de políticas no hace mejor profesor al tutor, ni detecta a un instructor
humano que califica injustamente. Cierra un agujero concreto: un agente que se
concede a sí mismo una autoridad que nunca se le dio. Ese agujero es estrecho y
aburrido, y es exactamente el tipo de agujero que acaba en la bandeja de un
regulador.

Si tu agente tiene una herramienta que cambia dinero, notas, accesos o contenido
público, el ejercicio útil de esta semana es listar esas intenciones y escribir
quién puede llamar a cada una. No lo que dice el prompt. Quién puede. La mayoría
de los equipos encuentran al menos una intención que nadie sabe justificar.
