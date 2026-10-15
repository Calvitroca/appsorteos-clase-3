# AppSorteos · Réplica académica

Proyecto en **HTML, CSS y JavaScript sin frameworks** para practicar la recreación de una interfaz web. Referencia visual: https://app-sorteos.com/es (consultada el 15 de octubre de 2026).

## Abrir el proyecto

1. Descomprime `appsorteos-clase.zip` conservando las carpetas.
2. Abre `index.html` con Chrome, Safari, Edge o Firefox.
3. Haz clic en **Comenzar**. Pega los números o nombres, separados por comas o saltos de línea. También puedes seleccionar **Rango de números**.
4. Configura ganadores, suplentes, exclusiones y cuenta regresiva.
5. Realiza el sorteo y descarga el resultado como PNG o CSV.

No necesitas instalar dependencias, usar claves de API ni crear cuentas. Los recursos gráficos están incluidos. Inter se solicita a Google Fonts cuando hay internet; si no está disponible se usa Arial. Abrir el archivo directamente basta para el sorteo y las descargas. La copia al portapapeles depende de los permisos del navegador y tiene una alternativa manual.

Opcional: para servirlo en `http://localhost:8000`, ejecuta `python3 -m http.server 8000` en la carpeta que contiene `index.html`.

## Archivos para estudiar

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Estructura semántica, navegación, portada, tarjetas, preguntas y formularios. |
| `styles.css` | Colores, medidas, cuadrículas, componentes y adaptación a pantallas pequeñas. |
| `draw-engine.js` | Lectura de listas, rangos, exclusiones y selección aleatoria. No depende del DOM. |
| `app.js` | Eventos, cambios de pantalla, borrador local, cuenta regresiva, ruleta y exportaciones. |
| `assets/` | Logo, tipografía de iconos e ilustraciones del sitio de referencia. |
| `tests/draw-engine.test.cjs` | Pruebas del motor usando únicamente Node.js. |

En el ZIP, las pruebas importan `../draw-engine.js`. En el repositorio de la versión alojada, los archivos web se encuentran dentro de `dist/` y las pruebas importan `../dist/draw-engine.js`.

## Qué se recreó

La cabecera fija, el bloque rosa de Instagram, el formulario de inicio, el selector de redes, la cuadrícula de herramientas, los módulos ilustrados, el acordeón de preguntas y el pie de página siguen la referencia. Se utilizaron medidas y colores observados en la página y recursos públicos del sitio original.

El flujo de participantes y configuración se implementó expresamente para la carga manual. Algunos textos informativos y las reseñas de ejemplo se adaptaron a la práctica. No se verificó una coincidencia visual píxel por píxel ni se reproduce cada pantalla del servicio original.

Las tarjetas de redes abren el mismo flujo manual con su correspondiente nombre. Los botones de cuenta, precios y Automation explican el alcance de la práctica; no contienen formularios de acceso, pagos ni conexiones reales. La ruleta animada, los números, el dado y la moneda usan el mismo motor local. Para más de 18 entradas, la ruleta muestra una selección visual; el cálculo siempre utiliza toda la población elegible.

## Cómo funciona el azar

`crypto.getRandomValues` genera valores enteros. El muestreo por rechazo evita el sesgo de módulo y una mezcla parcial de Fisher–Yates selecciona ganadores y suplentes **sin reemplazar entradas**. La animación revela un resultado ya calculado; no decide quién gana.

El modo predeterminado elige los resultados al azar. Con Eliminar duplicados desactivado, dos entradas con el mismo texto cuentan como oportunidades distintas y pueden aparecer ambas en los resultados. Las comparaciones de duplicados y exclusiones no distinguen mayúsculas y normalizan Unicode.

### Modo de prueba con ganador controlado

En la pantalla de carga de participantes, pulsa **Elegir ganador para prueba** y selecciona al primer ganador. Después pulsa Continuar e Iniciar prueba. Se ejecutan la misma cuenta regresiva y animación; el primer puesto se fija al participante elegido y los demás ganadores y suplentes se sortean entre las entradas restantes. La selección debe seguir siendo elegible después de aplicar exclusiones y duplicados.

El modo de prueba se identifica con una nota al pie del cuadro de sorteo, después de los controles. El texto copiado, la imagen y el CSV llevan la nota al final. Puedes repetir la prueba con el mismo primer ganador o volver al modo aleatorio desde el botón de carga. Esta selección no se guarda en localStorage y se desactiva al abrir un sorteo nuevo.

Límites: 10,000 entradas; 160 caracteres por participante; 100 ganadores y 100 suplentes. El archivo importado debe ser texto plano o un CSV simple, sin cabecera, con los participantes separados por comas, punto y coma o líneas. No es un lector de hojas de cálculo con varias columnas o comas entrecomilladas.

## Privacidad y datos

La lista y la configuración se guardan en `localStorage` de este navegador. No se envían a un servidor. **Borrar borrador** elimina los datos introducidos. Los enlaces y nombres de usuario se usan como referencia del sorteo y no descargan comentarios.

Los valores del usuario se insertan con `textContent`. La exportación CSV neutraliza los prefijos que una hoja de cálculo podría interpretar como fórmulas. Los resultados descargados incluyen los ganadores, suplentes y datos del sorteo.

## Validación

Con Node.js 22 o superior, ejecuta:

```bash
node --test tests/draw-engine.test.cjs
```

Las pruebas cubren listas y rangos, entradas inválidas, normalización, exclusiones, duplicados, límites, selección sin reemplazo, preservación de la lista, rechazo de valores aleatorios con sesgo y selección controlada en modo de prueba. También se comprobó la sintaxis de los archivos JavaScript y la integridad de rutas y elementos HTML. La comprobación visual de la réplica en navegador no estuvo disponible en el entorno de creación.

## Créditos

AppSorteos y las marcas mostradas pertenecen a sus respectivos titulares. El logo, los iconos, las ilustraciones y los logotipos de ejemplo se obtuvieron de los recursos públicos de AppSorteos para esta recreación académica independiente; no se afirma autoría ni patrocinio. Las reseñas son ejemplos ficticios identificados como tales. Este proyecto no es el servicio oficial ni emite certificados oficiales.
