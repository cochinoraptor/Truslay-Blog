---
title: 'Las 8 capas, explicadas sin marketing'
description: 'Signal, Lattice, Shield, Gate, Seal, Ledger, Anchor, Prism: una por modo de fallo, dónde acaba el SDK y empieza el Firewall, y cuándo 8 es excesivo.'
slug: eight-layers-without-the-marketing
date: 2026-10-28T10:00:00.000Z
image: /img/og/eight-layers-without-the-marketing.png
authors: [truslay]
tags: [architecture]
keywords:
  - Truslay 8 capas
  - arquitectura de seguridad para agentes de IA
  - SDK vs firewall
  - intercepción de intención
  - libro de auditoría inmutable
---

Ocho es un número sospechoso. Cuando un producto de seguridad presenta una pila
numerada, la cuenta suele ser lo que cabía en la diapositiva. La nuestra es ocho
porque hay ocho formas distintas en que una acción de agente puede estar mal, y
juntar dos significa dejar una sin tratar. Voy a intentar mostrar las costuras en
lugar de esconderlas.

<!-- truncate -->

## Capas 1 a 6: el SDK, dentro de tu proceso

Se ejecutan en el Sovereign Edge, que es un paquete npm. Sin red, sin cuenta, sin
viaje de ida y vuelta. Si desconectas la máquina, las capas 1 a 6 siguen
decidiendo.

**1. Signal — intercepta la intención.** La capa que de verdad importa y la que
la gente se salta en los diagramas. Antes de que se ejecute ninguna política, el
SDK captura lo que el agente está a punto de hacer como intención estructurada más
carga útil, no como prosa. Si no puedes nombrar la intención, no puedes tener una
política sobre ella.

**2. Lattice — carga el grafo de políticas.** Las políticas son un grafo de
condiciones con un orden de evaluación explícito, versionado y fijado. Fijado
importa: una evaluación que usó la versión 14 de la política hace seis meses
debería seguir siendo explicable hoy.

**3. Shield — normaliza y valida la carga útil.** Comprobaciones de tipo, rangos,
campos obligatorios y los ataques aburridos: importes desmesurados, ids de cliente
ausentes, códigos de moneda que no existen. Una carga útil que no pasa la
validación no puede producir `ALLOW`.

**4. Gate — decide, fail-closed.** La decisión de tres veredictos descrita en
[el contrato del veredicto](https://docs.truslay.com/docs/api-reference/verdicts).
`ALLOW` es el único valor que deja pasar la llamada; `REVIEW` y `BLOCK` la
detienen.

**5. Seal — firma la decisión.** Ed25519 sobre la decisión y sus entradas, para
que el registro pueda comprobarse sin confiar en el servicio que lo escribió.

**6. Ledger — añade, nunca edita.** Las decisiones entran en una estructura
append-only. Puedes añadir; no puedes reescribir en silencio el martes pasado.

## Capas 7 y 8: el Firewall, en tu perímetro

La frontera entre el SDK y el Firewall es la frontera entre *decidir* y
*corroborar*. Aquí es donde el marketing suele ponerse vago, así que va la
versión llana.

**7. Anchor — ancla la raíz del libro.** La raíz hash del libro se escribe en
algún sitio que no controlas en exclusiva, para que una edición posterior de la
historia local sea detectable. Esta es la capa que hace que «inmutable» signifique
algo distinto de «lo prometemos».

**8. Prism — resuelve lo que una máquina no debería decidir.** Los casos ambiguos
aparecen aquí para una persona: la pista de auditoría, la cola de revisión, la
doble aprobación y la resolución, que se registra como una nueva decisión
firmada. Prism no es un panel añadido por encima; es donde `REVIEW` se convierte
en el nombre de una persona.

Las capas 7 y 8 necesitan el Firewall, lo que implica una llamada de red, y esa
es la razón de que el modo live no sea el predeterminado. En modo live, un
Firewall inalcanzable produce `BLOCK` con `firewall_unavailable`. Incómodo para
los paneles de uptime. Correcto para los permisos.

## La tabla que pondría en la diapositiva

| Capa | Trabajo | Fallo que cierra |
| --- | --- | --- |
| Signal | Capturar la intención estructurada | El agente actúa sobre prosa que nadie puede inspeccionar |
| Lattice | Cargar el grafo de políticas fijado | Reglas que derivan entre despliegues |
| Shield | Validar la carga útil | Entradas mal formadas o fuera de rango |
| Gate | Decidir, fail-closed | Fallbacks fail-open, «avisos» consultivos |
| Seal | Firmar la decisión | Decisiones alteradas a posteriori |
| Ledger | Registro append-only | Logs borrados o reescritos |
| Anchor | Anclar la raíz | Historia local editada en bloque |
| Prism | Resolución humana | Casos ambiguos decididos por una máquina |

## Dónde duele de verdad la división

Compromiso honesto: el SDK funciona sin el Firewall, así que un equipo puede
adoptar las capas 1 a 6 en una tarde y sentir que ha terminado. Tienen
aplicación, pero no tienen anclaje ni un camino de resolución humana, y ambas
cosas son las que preguntan los auditores. El hueco es real y no lo escondemos:
se ve en el campo `signature`, que está presente cuando Seal se ejecutó en local,
y en si la raíz del libro se ha anclado o no.

Lo contrario también es cierto. Si solo ejecutas el Firewall sin el SDK, estás
inspeccionando tráfico después de que el agente ya formó la intención, y pierdes
la propiedad local de submilisegundo. La división no es decoración; cada mitad
falla de forma distinta.

## Dónde esto es excesivo

Si tu agente redacta correos que una persona envía, no necesitas ocho capas.
Necesitas una cola de revisión y un café. La pila se gana el sueldo en el momento
en que el agente toca algo caro o irreversible: dinero, notas, aprovisionamiento
de accesos, publicación pública, borrado de datos de producción. Esas son las
intenciones donde «normalmente se comporta bien» no es una respuesta que puedas
dar a un consejo.

La pila completa, con las responsabilidades exactas de cada capa y su
comportamiento ante fallos, está en
[la documentación de arquitectura](https://docs.truslay.com/docs/architecture/the-8-layers).
Empieza ahí si quieres la versión con diagramas; este artículo es la versión para
quien tiene que defender el diseño en una reunión.
