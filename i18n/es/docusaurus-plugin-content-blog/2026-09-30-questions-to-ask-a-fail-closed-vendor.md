---
title: 'Doce preguntas que hacer antes de comprar seguridad de IA fail-closed'
description: 'Las preguntas de evaluación que haríamos a un competidor, con la respuesta que debería preocuparte y la que no. Útil tanto si nos eliges como si no.'
slug: questions-to-ask-a-fail-closed-vendor
date: 2026-09-30T08:00:00.000Z
image: /img/og/questions-to-ask-a-fail-closed-vendor.png
authors: [truslay]
tags: [security, architecture]
keywords:
  - evaluar proveedor de seguridad de IA
  - checklist de guardrails fail-closed
  - compra de seguridad para agentes de IA
  - preguntas a proveedores de guardrails
---

Vendemos esta categoría, así que trata la lista con la desconfianza que
corresponde. Aun así es la lista que usamos internamente cuando miramos
productos adyacentes, y cada pregunta de abajo tiene una respuesta que nos haría
dar media vuelta.

<!-- truncate -->

## Aplicación

### 1. ¿Dónde ocurre físicamente la decisión?

La buena respuesta nombra un proceso, un límite y qué pasa sin red. «En nuestra
nube, con 40 ms p99» es una respuesta estupenda para otro producto. Si la
aplicación está a un salto del agente, la llamada a la herramienta está a un
salto de ocurrir sin ella.

### 2. ¿Qué pasa cuando el servicio de decisión no está disponible?

Escucha «falla abierto», «se degrada con elegancia», «caché con TTL». Un `ALLOW`
en caché es un `ALLOW` que no te has ganado. La respuesta que quieres es un
veredicto, no una política de reintentos: inalcanzable significa `BLOCK`.

### 3. ¿Puede el agente anular un veredicto?

Debería ser imposible por construcción, no por convención. Pide ver el camino de
código donde se invoca la herramienta y confirma que la única rama que entra en
él es la de `ALLOW`. «Se le indica al modelo que no lo haga» no es un control de
anulación.

### 4. ¿`REVIEW` está realmente bloqueado?

Muchos productos tratan la revisión como un permiso blando con notificación.
Pregunta qué hace el agente mientras una persona piensa. Si la respuesta es
«continúa con alcance reducido», has comprado un sistema de logs con pasos
extra.

### 5. ¿Cuál es la unidad determinista?

Insiste en el objeto que se versiona y se puede probar: un grafo de políticas, un
conjunto de reglas, un bundle firmado. Si la respuesta es «nuestro modelo», no
puedes escribir una prueba de regresión para una decisión de seguridad, y tu
auditor tampoco.

## Evidencia

### 6. ¿Qué contiene exactamente el registro de auditoría?

El registro debe permitir reconstruir la decisión un año después: intención,
carga útil, versión de la política, veredicto, motivo, marca de tiempo y quién
resolvió una revisión. Pide un registro de ejemplo, no una captura de pantalla de
un panel.

### 7. ¿Está firmado el registro, y con la clave de quién?

Firmado por el componente que tomó la decisión, con una clave que el cliente
pueda verificar y, idealmente, custodiar. El hash de un archivo de log demuestra
que el archivo no cambió después de hashearlo; no demuestra qué contenía.

### 8. ¿Puede un administrador editar o borrar registros?

La respuesta correcta incluye un mecanismo fuera del control del administrador:
anclaje, sellado de tiempo externo, un almacén write-once. Si «inmutable» es un
permiso de base de datos, es una política, y las políticas se cambian durante los
incidentes.

### 9. ¿Ha revisado la criptografía alguien que no trabaje para vosotros?

Aquí es donde preguntas por una auditoría de terceros, y donde deberías
desconfiar de la palabra «prevista». Pide el alcance, la firma y la fecha del
informe. Una auditoría en curso es una respuesta legítima siempre que se
presente como tal; una afirmación de superación sin informe no lo es.

## Operación

### 10. ¿Qué requiere un cambio de política?

Versionado, revisión y una forma de responder «qué política estaba activa cuando
se tomó esta decisión». Si cambiar un umbral es editar un campo en un panel, esa
misma edición es un cambio en tu postura de seguridad y necesita la misma
trazabilidad.

### 11. ¿Puede ejecutarse dentro de nuestro perímetro, y qué sigue llamando a casa?

Pide la lista de salidas, por escrito y por modo de despliegue. Luego pruébala:
desconecta, ejecuta la suite y mira qué funciones se degradan. La diferencia
entre el documento y el comportamiento es la respuesta real.

### 12. ¿Cuál es el coste de los falsos positivos, medido?

Todo sistema fail-closed bloquea algo legítimo. El proveedor debería conocer la
tasa, las tres causas principales y el camino que sigue una persona para
desbloquear una operación real a las 2 de la mañana. Si nadie lo ha medido, el
que medirá serás tú.

## Cómo usar esta lista

No la envíes como cuestionario; todos los proveedores responderán «sí» a las
doce. Ejecuta las preguntas 2, 3, 8 y 11 como pruebas durante una evaluación, con
tu propia carga de trabajo y tus propias políticas. El resto son para la
conversación posterior, cuando ya sabes qué respuestas eran ciertas.

Si quieres ejecutar las pruebas contra Truslay primero, el
[inicio rápido](https://docs.truslay.com/docs/introduction/quick-start) funciona
sin conexión, y la
[guía on-premise](https://docs.truslay.com/docs/security/on-premise-deployment)
cubre las preguntas de despliegue. Tráenos los fallos; son más útiles que los
elogios.
