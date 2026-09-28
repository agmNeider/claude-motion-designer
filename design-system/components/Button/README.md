# Button

Acción de una página o pieza. **Primary** (relleno `nogal`, texto `on-nogal`) una sola vez por vista, para lo que la página existe: "Agenda tu consulta", "Escríbenos". **Secondary** (borde `line-strong`, texto `nogal`) para acciones de apoyo; **quiet** para enlaces de acción dentro de texto.

- El consumidor da `children` (verbo primero, en tuteo: "Agenda tu consulta", nunca "Click aquí") y, si hace falta, `icon="arrow-right"` al final.
- Foco: anillo `focus-ring` de 2px separado 2px. No cambiar el radio `radius-md`.
- No: dos primarios juntos, mayúsculas sostenidas, emojis dentro del botón.
