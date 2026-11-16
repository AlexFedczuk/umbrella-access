Diseña el prototipo visual de una aplicación web llamada **Umbrella Access**, un sistema corporativo de gestión de turnos de acceso a instalaciones restringidas, inspirado en la identidad de Umbrella Corporation del universo Resident Evil.

## Contexto del proyecto

Umbrella Access es un sistema interno utilizado para organizar y controlar el ingreso programado de empleados, visitantes y proveedores a diferentes instalaciones de la corporación.

El sistema debe permitir solicitar, consultar, cancelar y reprogramar turnos, validar autorizaciones, controlar la disponibilidad horaria y la capacidad de cada sector, además de registrar ingresos y egresos.

El objetivo es crear un prototipo académico de alta calidad visual, coherente y realista, que represente las interfaces principales de una aplicación empresarial.

## Diseño visual

- Estética corporativa inspirada en Umbrella Corporation.
- Tema oscuro como diseño principal.
- Paleta de colores: negro (#0B0D10), gris oscuro (#171A20), rojo Umbrella (#C8102E), blanco y grises claros.
- Utilizar el logotipo característico de Umbrella Corporation como referencia de identidad visual.
- Estilo tecnológico, minimalista, elegante y profesional.
- Inspiración en interfaces de gestión de seguridad de instalaciones científicas.
- Paneles bien organizados, tarjetas, tablas, calendarios, indicadores de estado y formularios.
- Bordes sutiles, tipografía moderna, iconografía consistente y jerarquía visual clara.
- Evitar interfaces exageradamente futuristas, elementos decorativos innecesarios o efectos que dificulten la lectura.
- Todas las interfaces y sus textos deben estar completamente en español.

## Estructura general

Crear una aplicación web principalmente para escritorio, con diseño adaptable a pantallas móviles.

Las interfaces internas deben compartir un mismo sistema de diseño, con barra lateral de navegación, encabezado superior, identidad del usuario y contenido principal.

Diferenciar visualmente los perfiles de solicitante, seguridad y administrador, manteniendo una identidad visual uniforme.

## Pantallas a diseñar

### 1. Inicio de sesión

Pantalla de acceso corporativo con el logotipo de Umbrella, título "Umbrella Access", campos de identificación y contraseña, botón "Iniciar sesión" y mensajes de validación.

### 2. Panel principal del solicitante

Dashboard con bienvenida personalizada, nivel de autorización, resumen de próximos turnos, estado de solicitudes y accesos rápidos para solicitar un turno y consultar reservas.

### 3. Solicitar turno

Formulario dividido en pasos:
1. Seleccionar instalación.
2. Seleccionar sector de destino.
3. Indicar motivo de visita.
4. Seleccionar fecha y horario disponible.
5. Confirmar los datos de la solicitud.

Mostrar claramente las restricciones de autorización y la disponibilidad de cada sector.

### 4. Mis turnos

Listado de turnos solicitados, con filtros por fecha y estado.

Cada turno debe mostrar instalación, sector, fecha, hora y estado.

Agregar acciones para consultar detalles, cancelar o reprogramar una reserva.

### 5. Detalle y confirmación del turno

Pantalla con información completa del acceso reservado: número de turno, instalación, sector, fecha, franja horaria, titular, estado de autorización y requisitos de ingreso.

Incluir una identificación visual del turno y un mensaje claro de confirmación.

### 6. Reprogramación de turno

Interfaz que permita visualizar el turno original, consultar nuevas fechas y horarios disponibles y confirmar el cambio.

### 7. Panel del personal de seguridad

Dashboard para el personal encargado de controlar los accesos.

Mostrar los turnos previstos para el día, personas que deben ingresar, sectores autorizados, estados de acceso y controles para registrar ingresos y egresos.

### 8. Verificación de autorización

Interfaz para consultar una reserva y validar si una persona está autorizada a ingresar a una instalación.

Mostrar identificación, turno, sector, horario permitido y resultado de la validación.

Representar claramente los estados "Autorizado", "Pendiente" y "Denegado".

### 9. Panel del administrador

Dashboard general con indicadores de turnos, ocupación de sectores, accesos registrados, solicitudes pendientes y actividad reciente.

Incluir una tabla de gestión y una navegación administrativa clara.

### 10. Gestión de instalaciones y sectores

Pantalla administrativa para consultar y gestionar instalaciones, sectores restringidos, capacidad máxima, horarios de acceso y requisitos de autorización.

### 11. Gestión de usuarios y autorizaciones

Interfaz administrativa para consultar empleados, visitantes y proveedores, visualizar sus permisos y gestionar autorizaciones de acceso.

### 12. Notificaciones

Interfaz de notificaciones donde los usuarios puedan consultar confirmaciones, cancelaciones, modificaciones de turnos y alertas relacionadas con sus solicitudes.

## Consideraciones funcionales

El diseño debe contemplar situaciones reales del sistema:
- Turnos confirmados, pendientes y cancelados.
- Horarios sin disponibilidad.
- Capacidad máxima alcanzada en un sector.
- Usuarios sin autorización suficiente.
- Reservas que pueden reprogramarse o cancelarse.
- Confirmaciones y mensajes de error.

Usar información ficticia coherente con el universo de Umbrella Corporation, como instalaciones científicas y sectores restringidos, sin incorporar funcionalidades médicas, investigaciones, tratamientos, pagos ni datos científicos confidenciales.

## Resultado esperado

Generar un conjunto de pantallas visualmente consistentes y organizadas dentro de un mismo proyecto, mostrando los recorridos principales del sistema.

Priorizar la claridad funcional y la coherencia del diseño. Este es un prototipo académico, por lo que no se necesita implementar una base de datos, autenticación real ni lógica de backend.

La aplicación debe sentirse como un software corporativo profesional que Umbrella Corporation utilizaría realmente para gestionar el acceso a sus instalaciones.