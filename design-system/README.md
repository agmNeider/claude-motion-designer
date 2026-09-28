N.A.R. Abogados & Asociados es una firma de abogados en Sincé, Sucre (Colombia), ubicada frente al D1. Atiende a personas y familias de la región en derecho de familia, trámites de tránsito, documentos, certificados y asesoría jurídica. La marca debe sentirse cercana y seria a la vez: un despacho de madera y papel, no una corporación de vidrio.

Lema: *Tu tranquilidad, nuestra prioridad.*

## Contenido y voz

- Habla de tú, en español de Colombia: "Escríbenos y te asesoramos", "Si deseas divorciarte, te acompañamos en el proceso". Nunca "usted" en redes; "usted" solo en documentos formales.
- Abre con la pregunta que el cliente ya se hace: "¿Tu hijo tiene derecho a recibir alimentos?", "¿No te están pagando?". Responde en frases cortas y concretas.
- Cierra con una frase firme y una acción: "No es un favor. Es una obligación legal." / "Cada caso es diferente." y luego el contacto.
- Nombra la norma cuando la hay, en estilo `radicado`: "Art. 154 C.C.", "Ley 25 de 1992". No cites una norma que el equipo no haya verificado.
- Términos del oficio tal cual: cuota alimentaria, comparendo, derecho de petición, tutela, certificado de libertad y tradición, RUNT, REDAM, sociedad conyugal.
- Emojis solo en el texto del caption (✨ ⚖️ 📍, máximo dos). En las piezas gráficas nunca: usa `Icon`.
- Mayúsculas espaciadas (`label`) solo para antetítulos y "ABOGADOS & ASOCIADOS". Los títulos van en tipo oración.

## Servicios (inventario para piezas y video)

| Área | Ícono | Subservicios |
| --- | --- | --- |
| Derecho de familia | `users` | Cuota alimentaria, divorcio (mutuo acuerdo o contencioso), separación de cuerpos, liquidación de sociedad conyugal |
| Trámites de tránsito | `car` | Comparendos, multas y acuerdos de pago, sanciones, suspensión o cancelación de licencia, embargos vehiculares |
| Elaboración de documentos | `file-text` | Derechos de petición, tutelas, contratos, poderes y autorizaciones, solicitudes y reclamaciones |
| Certificados y trámites | `file-badge` | Libertad y tradición, catastral, RUNT, RUT, REDAM, antecedentes |
| Asesoría jurídica | `scale` | Asesoría y acompañamiento legal |

Diferenciales que la firma declara: asesoría personalizada (`shield-check`), gestión eficiente y oportuna (`handshake`), experiencia en el sector (`scale`).

## Color

- `nogal` es el color primario y viene del logotipo de la firma. Úsalo en el logotipo, los títulos de marca, el botón primario y los íconos. Es el único color de marca en rellenos grandes.
- `tinta` es el secundario (azul petróleo de expediente). Úsalo en enlaces, avisos informativos, el anillo de foco y bloques de contraste en video. Nunca compite con `nogal` en la misma área: uno manda y el otro acompaña.
- `laton` es un acento metálico solo para filetes, viñetas, la balanza y destellos. Como texto, solo a 24px o más (3.0:1 sobre `surface` en claro).
- Neutros: `surface` (lino) como fondo, `surface-raised` para tarjetas, `surface-sunken` para franjas y campos. Texto en `ink` e `ink-muted`.
- `espresso` es el fondo oscuro de marca para video, portadas y fotografía oscurecida. Encima va el `ink` del tema oscuro o `laton`.
- Texto sobre relleno de color: `on-nogal` y `on-tinta`, nunca blanco puro.
- Estados (`exito`, `aviso`, `error`, cada uno con su `-soft`): solo en contextos de caso o formulario y siempre con una palabra. No son decoración.
- Proporción de una pieza: 70% neutros, 20% `nogal`, 10% `tinta` y `laton` juntos.
- Todos los pares de texto cumplen 4.5:1 en ambos temas. `line-strong` cumple 3:1 para bordes de controles.

## Tipografía

- `display-xl`, `display-l` y `heading` en Libre Caslon Display: títulos. Es un serif de imprenta con aire de documento notarial. Úsalo grande y con poco texto.
- `lema` (Libre Caslon Text cursiva) para el lema y firmas; `cita` para la frase clave del `Callout`.
- `title`, `body`, `body-s` y `label` en Hanken Grotesk: todo lo que se lee de corrido, las listas y las etiquetas.
- `radicado` en IBM Plex Mono: artículos de ley, radicados y teléfonos en tablas.
- Máximo dos familias por pieza, más el mono si hay una norma. Nunca el display en párrafos.

## Forma, espacio y superficies

- Esquina amplia `radius-lg` en tarjetas y diapositivas (el sello de los posts de la firma); `radius-pill` en tags y en la franja de contacto; `radius-md` en botones.
- Márgenes generosos: `space-8` dentro de diapositivas, `space-6` dentro de tarjetas, `space-12` entre secciones.
- Sobre superficie lisa, separa con borde `line`; sobre fotografía, usa `shadow-card`. No uses ambos a la vez.

## Imagen

- Fotografía de madera, balanza, mazo, estrados y documentos, siempre cálida y en penumbra. Oscurécela con `espresso` al 55–65% y pon encima una tarjeta `surface-raised`.
- Sin personas de banco de imágenes posando. Si hay personas, que sea el equipo real de la firma.
- Documentos judiciales reales: solo con datos personales tachados.

## Movimiento (video y redes)

- Tempo de referencia: 120 BPM. Un compás = 2 s; los cortes y entradas caen en tiempos fuertes.
- Entradas: 400–600 ms, curva `cubic-bezier(0.22, 1, 0.36, 1)` (desaceleración suave). Salidas: 250–350 ms, `cubic-bezier(0.64, 0, 0.78, 0)`.
- Los trazos se dibujan (filetes de `laton`, la balanza, los íconos) y el texto sube de 24px a 0 con fundido. Nada rebota salvo el pin de ubicación.
- Transición firma: barrido diagonal de `nogal` a `espresso`.
- Respeta `prefers-reduced-motion`: fundidos simples sin desplazamiento.

## Iconografía

- Set Lucide (licencia ISC), trazo 1.5px, extremos redondeados, 24×24. Es un sustituto elegido para la firma, que no tiene set propio.
- En componentes usa `Icon` (hereda `color`). Los SVG del grupo Iconos traen el trazo horneado en `nogal` para usarlos en `<img>`.
- Encabezando un servicio, el ícono va en un disco `nogal-soft` de 52px (`nar-disc`).

## Logotipo

- Usa los archivos del grupo Logotipo; no redibujes ni recompongas "N.A.R.". `nar-wordmark-nogal.png` va sobre fondos claros y `nar-wordmark-marfil.png` sobre `espresso` o fotografía oscura.
- Área de respeto: la altura del punto de "N.A.R." por cada lado. Ancho mínimo: 120px en pantalla.
- Los archivos actuales vienen de un post (636×240 px). Para impresión o video 4K se necesita el archivo vectorial original.
