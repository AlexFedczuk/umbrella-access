# Punto 1 - Dominio, objetivos y stakeholders

## 1.1 Dominio elegido

El dominio elegido es la gestion de turnos de acceso a instalaciones restringidas de Umbrella Corporation.

Umbrella Access sera un sistema destinado a organizar el ingreso programado de empleados, visitantes y proveedores a sectores que requieren autorizacion previa. Permitira solicitar, aprobar, cancelar y reprogramar turnos de acceso.

Antes de confirmar una reserva, el sistema verificara la identidad de la persona, su nivel de autorizacion, el sector al que desea ingresar, la fecha y el horario disponibles, la capacidad maxima y los requisitos de seguridad correspondientes.

El personal de seguridad podra consultar la agenda diaria y registrar los ingresos y egresos.

El sistema tendra un alcance administrativo y operativo. No administrara investigaciones, historias medicas, tratamientos, experimentos ni informacion cientifica confidencial.

## 1.2 Objetivo general

Disenar un sistema que permita gestionar de manera segura, ordenada y eficiente los turnos de acceso a las instalaciones restringidas de Umbrella Corporation.

## 1.3 Objetivos especificos SMART

### Objetivo 1 - Centralizar las reservas

Disenar y dejar especificada, antes de la entrega del trabajo practico, una unica plataforma que permita solicitar, consultar, cancelar y reprogramar turnos de acceso.

Indicador: documentar los casos de uso correspondientes a estas operaciones y validarlos mediante pruebas funcionales.

### Objetivo 2 - Validar autorizaciones

Lograr que, durante la prueba funcional del MVP, el sistema valide automaticamente y antes de confirmar cada turno si la persona posee el nivel de autorizacion requerido para ingresar al sector seleccionado.

Indicador: ninguna reserva podra confirmarse si el usuario no cuenta con la autorizacion correspondiente.

### Objetivo 3 - Controlar la capacidad

Evitar que, durante la prueba funcional del MVP, se confirme alguna reserva que supere la capacidad maxima permitida de un sector.

Indicador: el sistema debera rechazar automaticamente las solicitudes que excedan la capacidad disponible.

### Objetivo 4 - Reducir el tiempo de gestion

Reducir, durante la prueba piloto del MVP, el tiempo promedio necesario para registrar un turno de acceso de cinco minutos a menos de dos minutos.

Indicador: comparar una muestra de 30 solicitudes gestionadas manualmente con otra muestra de 30 solicitudes realizadas mediante Umbrella Access.

### Objetivo 5 - Registrar los ingresos

Registrar digitalmente al menos el 95 por ciento de los ingresos correspondientes a turnos confirmados durante el primer periodo de prueba del MVP.

Indicador: comparar la cantidad de turnos confirmados con la cantidad de ingresos registrados por el personal de seguridad.

## 1.4 Stakeholders

Los stakeholders son todas las personas, areas, organizaciones o servicios que tienen interes en el proyecto, pueden verse afectados por el sistema o pueden influir en su funcionamiento.

| Stakeholder | Interes o participacion |
|---|---|
| Empleados de Umbrella | Solicitan turnos para ingresar a sectores restringidos. |
| Visitantes externos | Solicitan autorizacion y horarios de ingreso. |
| Proveedores | Reservan accesos para realizar tareas autorizadas. |
| Personal de seguridad | Controla reservas, valida identidades y registra ingresos y egresos. |
| Recepcion | Registra visitantes y verifica sus datos al momento del ingreso. |
| Responsables de cada sector | Definen horarios, capacidad y requisitos de acceso. |
| Administrador del sistema | Gestiona usuarios, roles, sectores y configuraciones. |
| Recursos Humanos | Valida la relacion laboral y los permisos de los empleados. |
| Area de Bioseguridad | Define requisitos para sectores especificos. |
| Direccion de Umbrella | Supervisa el sistema y consulta reportes generales. |
| Area de Auditoria | Consulta el historial de accesos y verifica reglas. |
| Servicio de correo | Envia confirmaciones, cancelaciones y recordatorios. |
| Soporte tecnico | Atiende errores y problemas del sistema. |
| Equipo de desarrollo | Analiza, disena, implementa y prueba la solucion. |
| Autoridades de seguridad | Pueden solicitar reportes de accesos y movimientos. |

## 1.5 Resumen

Umbrella Access resolvera la gestion manual y desorganizada de los accesos a sectores restringidos de Umbrella Corporation. El sistema permitira administrar turnos, controlar autorizaciones, evitar exceder la capacidad de los sectores, registrar ingresos y generar informacion util para la organizacion.

Los objetivos se expresan mediante la metodologia SMART porque son especificos, medibles, alcanzables, relevantes y limitados en el tiempo. Los stakeholders contemplan a los usuarios finales y a las areas operativas, administrativas, tecnicas y directivas relacionadas con el proyecto.

### Trazabilidad con el alcance del MVP

Los objetivos 1 a 5 se validaran con las funcionalidades incluidas en el alcance del MVP del punto 4. Los indicadores se comprobaran mediante escenarios de prueba sobre solicitudes, autorizaciones, capacidad, registro de ingresos y notificaciones.
