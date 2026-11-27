---
title: 'Un veredicto no es una probabilidad: por qué borramos la puntuación'
description: 'Los guardrails probabilísticos te dan un número y esperan que hayas elegido bien el umbral. Un grafo de políticas devuelve ALLOW, REVIEW o BLOCK, y puede demostrarlo.'
slug: deterministic-verdicts-not-probability
date: 2026-11-18T09:00:00.000Z
image: /img/og/deterministic-verdicts-not-probability.png
authors: [truslay]
tags: [architecture, security]
keywords:
  - guardrails de IA deterministas
  - agentes de IA fail-closed
  - evaluación con grafo de políticas
  - seguridad de llamadas a herramientas
  - veredicto ALLOW REVIEW BLOCK
---

La primera versión interna de Truslay devolvía una puntuación. Algo entre 0 y 1,
más alto significa más riesgo, y una guía de integración que decía «bloquea por
encima de 0,7, revisa entre 0,4 y 0,7». La ejecutamos contra cuatro flujos de
agentes durante un mes. Luego la borramos, y nadie del equipo la echa de menos.

La razón honesta es esta. Cada vez que la puntuación salía en 0,62, dos personas
de la llamada discrepaban en silencio sobre qué debía pasar después, y ninguna de
las dos se equivocaba. El número tampoco se equivocaba. Simplemente no era una
decisión.

<!-- truncate -->

## Un umbral es una política que no puedes leer

Cuando un clasificador devuelve 0,62, lo que tienes es una conjetura comprimida
sobre una distribución de ejemplos pasados. El umbral que pones encima es una
segunda conjetura, hecha una vez, normalmente durante una demo, y casi nunca
escrita en un sitio donde un revisor de seguridad pueda encontrarla.

Esto no es una crítica a los clasificadores. Los usamos. Son excelentes
respondiendo «¿este texto parece una petición de reembolso?». Son malos
respondiendo «¿puede este agente mover 4.190 € de esta cuenta ahora mismo?»,
porque la segunda pregunta trata de permisos, no de similitud con texto anterior.

Un permiso tiene estructura. Un reembolso tiene un importe, una moneda, un cliente,
un solicitante, una ventana temporal y una persona responsable si sale mal. Cuando
escribes todo eso, la decisión deja de ser cuestión de gusto.

## Qué devuelve en su lugar

El SDK devuelve uno de tres veredictos por acción: `ALLOW`, `REVIEW`, `BLOCK`.
Nada más, ninguna puntuación que interpretar.

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

El sobre lleva más que la palabra: un `reason` legible por máquina, un `latencyMs`
medido en tu máquina, un `auditId` para el registro sellado y una `signature`
producida por la capa Seal. Un reembolso por encima del techo vuelve como `BLOCK`
con `reason: "policy_denied"`, y el importe está en la ruta del código de motivo,
no enterrado en un float.

## Tres propiedades, y por qué cada una es comprobable

**Determinismo.** Misma intención, misma carga útil, mismo grafo de políticas,
mismo veredicto. No «normalmente el mismo». Esto importa más de lo que parece:
significa que puedes escribir una prueba de regresión para una decisión de
seguridad, en CI, sin ningún modelo en el bucle.

**Fail-closed.** Si no se puede producir la decisión, no se ejecuta nada. Un
Firewall live que expira devuelve `BLOCK` con `firewall_unavailable`. Una
respuesta mal formada se trata como denegada. No hay rama fail-open que
configurar por accidente.

**Evidencia.** Un veredicto se firma y se añade a un libro, y la raíz del libro se
ancla para poder comprobarla después. Una línea de log dice lo que imprimió un
proceso. Esto dice qué se decidió, para qué carga útil y en qué momento, en una
forma que no cambia en silencio.

## Los clasificadores siguen teniendo su sitio

Quiero ser cuidadoso aquí, porque «determinista» se vende como «no hace falta ML
en ningún sitio», y esa no es nuestra postura.

Un clasificador es una buena *entrada* para un grafo de políticas. «¿Contiene
este ticket una amenaza de autolesión?» es una pregunta genuinamente difusa, y un
modelo la responde mejor que cualquier regla que yo pudiera escribir. El movimiento
importante es qué pasa con esa respuesta: se convierte en una señal que el grafo
lee, y el grafo decide. El modelo propone, la Compuerta dispone. Si el modelo está
caído o devuelve algo fuera de su contrato, el grafo deriva a `REVIEW`, que sigue
significando que la llamada no se ejecuta.

Lo que quitamos no fue el modelo. Fue la autoridad del modelo para tener la última
palabra.

## Qué te cuesta esto

Dos cosas, y ninguna es pequeña.

Tienes que escribir políticas. No prompts, políticas: techos, roles, destinos de
escalado, segmentos de clientes. Alguien que entiende el negocio tiene que sentarse
con alguien que entiende el agente, y esa reunión es el producto. No podemos
generarla a partir de tus logs, y los proveedores que dicen que sí te están
vendiendo un umbral con pasos extra.

Y pierdes la cómoda ambigüedad de una puntuación. Cuando el veredicto es `BLOCK`
porque un agente intentó cambiar una nota que él mismo había asignado, no hay
«bueno, 0,68, estuvo cerca». Hay una decisión, un código de motivo y una persona
a la que escalar. A algunos equipos les resulta incómodo durante una semana.
Después descubren que es la única forma de dormir.

## Preguntas que recibimos cada semana

### ¿Esto no es solo un motor de reglas?

No, pero la diferencia es más estrecha de lo que los proveedores insinúan. Un
motor de reglas evalúa condiciones que escribiste de antemano; el grafo de
políticas también lleva el plan de ejecución: qué capa evalúa qué, qué pasa cuando
una capa no está disponible y cómo se sella la decisión. El determinismo viene del
grafo, no de la ausencia de lógica.

### ¿Y la inyección de prompts y la deriva?

La inyección es justo el caso en que falla una puntuación. La instrucción
inyectada suele parecerse *más* a una petición legítima que la real, así que un
modelo de similitud la aprecia. A un grafo no le importa lo plausible que sea el
texto; comprueba si este agente puede realizar esta acción con esta carga útil. La
deriva en el comportamiento del modelo es real, y por eso el punto de aplicación
está entre el modelo y la herramienta, no dentro del modelo.

### ¿Añade latencia?

Las capas 1 a 6 se ejecutan en proceso y sin conexión; la documentación cita
decisiones por debajo del milisegundo, y el campo `latencyMs` te permite
comprobarlo en tu propio hardware en lugar de fiarte del nuestro. Las capas 7 y 8
implican al Firewall y cuestan un viaje de red, y por eso el modo live es una
decisión deliberada y no el predeterminado.

Si quieres ver la diferencia en tu propio agente, el
[inicio rápido](https://docs.truslay.com/docs/introduction/quick-start) se ejecuta
en sandbox sin credenciales, y el
[contrato del veredicto](https://docs.truslay.com/docs/api-reference/verdicts)
cubre cada código de motivo. Empieza por ahí antes de hablar con nadie, nosotros
incluidos.
