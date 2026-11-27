---
title: 'Qué sale realmente de tu red cuando ejecutas Truslay'
description: 'Qué sale de tu red cuando Truslay funciona air-gapped: nada en sandbox. Esto es lo que envía cada modo y lo que el aislamiento no arregla.'
slug: air-gapped-what-stays-on-your-network
date: 2026-10-15T09:15:00.000Z
image: /img/og/air-gapped-what-stays-on-your-network.png
authors: [truslay]
tags: [deployment, security, architecture]
keywords:
  - seguridad de IA air-gapped
  - firewall de agentes de IA on-premise
  - infraestructura de IA soberana
  - residencia de datos en agentes de IA
  - evaluación de políticas sin conexión
---

La pregunta de compras nunca es «¿es seguro?». Es «¿qué sale de nuestra red y
puedes demostrármelo?». Pregunta justa, y una que la mayoría de proveedores de
seguridad de IA responde con un diagrama de arquitectura y un párrafo sobre cifrado
en tránsito.

Así que aquí va la versión menos halagadora y más útil: un desglose por modo de
qué va a dónde, incluido el caso en que la respuesta es «nada».

<!-- truncate -->

## Sandbox: no cruza nada

Sandbox es el modo por defecto. `firewallMode` simplemente no se define y el SDK
evalúa en local: entra la intención, sale el veredicto, sin abrir ningún socket.

No es un modo demo que finge funcionar. Es la misma ruta de evaluación que
producción, menos los pasos de corroboración, y por eso es el lugar correcto para
ejecutar CI. Tu pipeline obtiene veredictos deterministas en cada commit sin
credenciales, sin cuenta de proveedor y sin reglas de salida que mantener.

```bash
# CI air-gapped: no se necesita interfaz de red para las capas 1 a 6.
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

## Live: un endpoint, y tú eliges dónde vive

En modo live el SDK envía la intención estructurada y la carga útil al Firewall,
y el Firewall devuelve una decisión. Ese es todo el patrón de tráfico de las
capas 7 y 8. Ni historial de prompts, ni pesos de modelo, ni documentos de tu
corpus. El SDK nunca los tuvo: Signal capturó la intención, no la conversación.

Y el Firewall es un desplegable, no un endpoint multiinquilino en el que tengas
que confiar. La guía on-premise explica cómo ejecutarlo dentro de tu propio
perímetro, lo que convierte la relación con el proveedor en un artefacto
versionado que instalas y actualizas a tu ritmo. Si tu requisito es «el
componente que decide está detrás de nuestra frontera», esa es la configuración
que hay que pedir y la que hay que probar durante una evaluación, no después de
firmar.

| Modo | Qué cruza la frontera | Dónde se produce la decisión |
| --- | --- | --- |
| Sandbox | Nada | En proceso, capas 1–6 |
| Live, Firewall alojado | Intención + carga útil | Firewall, capas 4–8 |
| Live, Firewall on-premise | Intención + carga útil, dentro de tu red | Tu perímetro, capas 4–8 |
| Anchor | Hash de la raíz del libro | Donde apuntes el anclaje |

## La prueba que haría antes de creerme nada de esto

Desconecta la red. Ejecuta la suite de sandbox. Si los veredictos llegan con
latencias por debajo del milisegundo y sobres firmados, la promesa local es
cierta para tu carga de trabajo, no solo para la nuestra. Luego restaura la red,
quita la URL del Firewall en modo live y observa qué pasa: debería ser `BLOCK`
con `firewall_unavailable`, no un timeout seguido de un fallback permisivo.

Esa segunda prueba es la que separa un producto fail-closed de una diapositiva
fail-closed. Hemos estado en salas donde la respuesta era «nos degradamos con
elegancia», lo que en la práctica significa que la llamada a la herramienta se
ejecuta.

## Lo que el aislamiento no te da

Cuatro cosas, porque la lista honesta es corta y la gente planifica alrededor de
la equivocada.

**No elimina el trabajo de políticas.** Alguien tiene que decidir que los cambios
de notas son cosa de personas y que los reembolsos por encima de 2.000 € necesitan
una segunda mirada. Una instalación air-gapped con un grafo de políticas vago es
una forma caras de permitirlo todo.

**No hace que la revisión sea cómoda en asíncrono.** Prism resuelve los veredictos
`REVIEW` con personas. Si esas personas están en otra zona de red, la cola cruza
una frontera que acabas de cerrar; planifica el camino humano con el mismo cuidado
que el de los datos.

**No arregla la gestión de claves.** La capa Seal firma con una clave. Air-gapped
significa que tú custodias esa clave, lo que también significa rotarla, hacer
copia de seguridad y poder explicar dónde estaba a las 3 de la mañana el trimestre
pasado.

**No sustituye tus controles existentes.** Truslay se sitúa entre el agente y la
herramienta. Tu IAM, tus permisos de base de datos y tu política de red siguen
haciendo su trabajo; esto cierra el hueco donde un agente autónomo con
credenciales válidas hace algo perfectamente autorizado y completamente
equivocado.

Si quieres ejecutar la lista real en lugar de leer sobre ella, la
[guía de despliegue on-premise](https://docs.truslay.com/docs/security/on-premise-deployment)
tiene los pasos ordenados, los puertos y qué verificar después de cada uno.
Llévala a tu equipo de seguridad antes de llevar la presentación de un proveedor.
