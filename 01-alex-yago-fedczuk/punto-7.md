# Punto 7 - Pruebas de los casos de uso

## 7.1 Introduccion

En este punto se proponen pruebas para los doce casos de uso del punto 3. Se utiliza la tabla solicitada por la consigna, con el identificador, la funcionalidad, la precondicion, los pasos y el resultado esperado.

Las pruebas se plantean como una primera propuesta y deberan revisarse si la charla con el cliente modifica alguna regla del sistema.

## 7.2 Tabla de pruebas

| ID | Funcionalidad | Precondicion | Pasos | Resultado esperado |
|---|---|---|---|---|
| TU-01 | Iniciar sesion | El usuario tiene una cuenta activa. | 1. Ingresar identificacion y contrasena. 2. Seleccionar iniciar sesion. | El sistema permite el acceso y muestra el panel correspondiente. Si los datos son incorrectos, rechaza el acceso. |
| TU-02 | Consultar disponibilidad | El sector tiene horarios y capacidad configurados. | 1. Elegir instalacion y sector. 2. Seleccionar una fecha. | El sistema muestra las franjas disponibles. Los horarios completos aparecen como no disponibles. |
| TU-03 | Solicitar turno | El solicitante inicio sesion y existe una franja disponible. | 1. Elegir instalacion y sector. 2. Indicar motivo. 3. Elegir fecha y horario. 4. Confirmar. | El sistema registra la solicitud, genera un codigo y muestra si queda confirmada o pendiente. Si falta un dato, no la confirma. |
| TU-04 | Consultar turnos | El solicitante inicio sesion. | 1. Entrar a Mis turnos. 2. Seleccionar una reserva. | El sistema muestra solamente los turnos del solicitante, con fecha, lugar, estado y requisitos. |
| TU-05 | Reprogramar turno | Existe un turno vigente que puede modificarse. | 1. Abrir el detalle del turno. 2. Elegir reprogramar. 3. Seleccionar otra fecha y horario. 4. Confirmar. | El sistema actualiza el turno y libera el horario anterior. Si no hay cupo, conserva el turno original. |
| TU-06 | Cancelar turno | Existe un turno vigente y cancelable. | 1. Abrir el detalle. 2. Elegir cancelar. 3. Confirmar la cancelacion. | El turno pasa a estado cancelado y se libera el lugar. Si se desiste, queda sin cambios. |
| TU-07 | Buscar turno | El guardia inicio sesion y puede consultar los accesos de su instalacion. | 1. Abrir el panel de accesos. 2. Buscar por nombre, documento o codigo. | El sistema muestra las reservas coincidentes. Si no hay resultados, informa la situacion. |
| TU-08 | Verificar autorizacion | Hay una reserva localizada y una persona presente en el puesto de control. | 1. Revisar la identidad. 2. Consultar el codigo o la reserva. 3. Comparar fecha, horario y sector. | El sistema indica si el acceso esta autorizado, pendiente o denegado. Una reserva invalida no permite ingresar. |
| TU-09 | Registrar ingreso | La persona fue identificada y tiene autorizacion vigente. | 1. Seleccionar registrar ingreso. 2. Confirmar la operacion. | El sistema guarda la fecha y hora, registra al guardia y actualiza la ocupacion. No permite ingresos duplicados ni superar la capacidad. |
| TU-10 | Registrar egreso | La persona tiene un ingreso activo. | 1. Buscar a la persona o su reserva. 2. Seleccionar registrar egreso. | El sistema guarda la fecha y hora de salida y reduce la ocupacion. Si no habia ingreso, no registra el egreso. |
| TU-11 | Configurar sector | El administrador inicio sesion y tiene permiso para configurar sectores. | 1. Elegir un sector. 2. Modificar capacidad u horarios. 3. Confirmar. | El sistema guarda los datos validos. Si los valores son incorrectos, informa el error y no guarda el cambio. |
| TU-12 | Gestionar autorizaciones | El administrador inicio sesion y la persona esta registrada. | 1. Buscar una persona. 2. Modificar sectores o nivel de autorizacion. 3. Confirmar. | El sistema guarda los nuevos permisos. Si los datos son invalidos, conserva la autorizacion anterior. |

## 7.3 Observacion

Estas pruebas cubren los caminos principales y algunos errores de los doce casos de uso del punto 3. Por el momento son una propuesta escrita; para ejecutarlas haria falta implementar el sistema y elegir una herramienta de pruebas.
