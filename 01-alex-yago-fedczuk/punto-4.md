# Punto 4 - Alcance tentativo del MVP

## 4.1 Definicion del MVP

El MVP (Producto Minimo Viable) de Umbrella Access sera una version funcional y acotada del sistema que permita gestionar el ciclo basico de un turno de acceso a instalaciones restringidas: solicitarlo, validarlo, confirmarlo, consultarlo y registrar el ingreso y el egreso.

El MVP se propone para un escenario controlado de Umbrella Corporation, con usuarios y sectores previamente cargados. Su objetivo es validar que la organizacion pueda reemplazar la gestion manual de turnos por un flujo digital seguro y trazable.

## 4.2 Incluido en el MVP

- Inicio de sesion y acceso segun rol: solicitante, personal de seguridad y administrador.
- Solicitud de turnos seleccionando sector, fecha, horario y motivo.
- Consulta del listado y detalle de los turnos propios.
- Validacion de autorizacion, disponibilidad horaria y capacidad maxima.
- Confirmacion, rechazo o estado pendiente de la solicitud.
- Cancelacion y reprogramacion de turnos validos.
- Consulta de la agenda diaria por el personal de seguridad.
- Verificacion del turno y registro de ingreso y egreso.
- Alta y configuracion basica de sectores, horarios, capacidad y requisitos.
- Notificaciones de confirmacion, cambios y cancelaciones.
- Registro de operaciones relevantes para consulta administrativa.

## 4.3 Excluido del MVP

- Historias clinicas, tratamientos, investigaciones y resultados de laboratorio.
- Gestion de experimentos, muestras o informacion cientifica confidencial.
- Facturacion, cobros, pagos o integracion con sistemas contables.
- Control biometrico, lectores fisicos, torniquetes o integraciones IoT.
- Aplicaciones moviles nativas; el MVP se limitara a una interfaz web o prototipo navegable.
- Integracion con sistemas externos de Recursos Humanos, proveedores o autoridades.
- Reportes avanzados, tableros analiticos y predicciones de demanda.
- Gestion completa de credenciales temporales o permisos especiales fuera del flujo basico.
- Soporte multiempresa, multiidioma o despliegue para sedes externas.

## 4.4 Supuestos y restricciones

- Los usuarios, roles y sectores iniciales se cargan previamente por el administrador.
- Las reglas de autorizacion, horarios y capacidad son proporcionadas por los responsables de cada sector.
- La identidad se verifica mediante los datos registrados y el personal de seguridad; no se requiere biometria.
- Las notificaciones pueden modelarse mediante correo o una simulacion equivalente, sin exigir una integracion productiva.
- El alcance es tentativo y puede ajustarse luego de revisar los casos de uso y el prototipo del equipo.

## 4.5 Criterios de validacion del MVP

El MVP se considerara suficiente cuando pueda demostrarse que:

1. Un solicitante puede crear y consultar un turno.
2. El sistema rechaza una solicitud sin autorizacion o sin capacidad disponible.
3. Un solicitante puede cancelar o reprogramar un turno valido.
4. El personal de seguridad puede consultar la agenda y registrar ingreso y egreso.
5. El administrador puede configurar los datos basicos de un sector.
6. Cada operacion relevante deja un estado o registro consultable.

## 4.6 Relacion con el punto 1

Este alcance permite medir los objetivos SMART definidos en el punto 1: centralizacion de reservas, validacion de autorizaciones, control de capacidad, reduccion del tiempo de gestion y registro digital de ingresos. Las exclusiones evitan ampliar el proyecto hacia funcionalidades que no son necesarias para validar la idea principal del sistema.
