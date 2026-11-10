# Punto 7 - Pruebas unitarias de los casos de uso

## 7.1 Criterio de trabajo

Las pruebas se basan en los doce casos de uso documentados por el equipo en el punto 3: iniciar sesión, consultar disponibilidad, solicitar turno, consultar turnos, reprogramar turno, cancelar turno, buscar turno, verificar autorización, registrar ingreso, registrar egreso, configurar sector y gestionar autorizaciones.

Cada prueba verifica una regla puntual mediante un escenario positivo y, cuando corresponde, un escenario alternativo o de rechazo.

## 7.2 Pruebas unitarias

### TU-CU-01 - Iniciar sesión

**Dado** un usuario registrado y activo con credenciales válidas.

**Cuando** ingresa su identificación y contraseña.

**Entonces** el sistema valida las credenciales, identifica el perfil y habilita el panel correspondiente.

**Caso alternativo:** con credenciales incorrectas o cuenta inactiva, el acceso se rechaza y no se inicia una sesión.

### TU-CU-02 - Consultar disponibilidad

**Dado** un solicitante autenticado que eligió una instalación y un sector.

**Cuando** selecciona una fecha.

**Entonces** el sistema muestra las franjas horarias disponibles según los cupos y permite elegir una franja habilitada.

**Caso alternativo:** los horarios completos aparecen deshabilitados y un sector no habilitado no puede seleccionarse.

### TU-CU-03 - Solicitar turno

**Dado** un solicitante autenticado y una instalación con sectores configurados.

**Cuando** completa motivo, sector, fecha y horario, y confirma la solicitud.

**Entonces** el sistema valida cupo y autorización, registra la solicitud, genera un código único y asigna estado confirmado o pendiente.

**Caso alternativo:** si se agotó el cupo, falta un dato o la autorización requiere aprobación, la solicitud no habilita el ingreso y conserva el estado correcto.

### TU-CU-04 - Consultar turnos

**Dado** un solicitante autenticado con reservas asociadas.

**Cuando** abre la sección Mis turnos y selecciona una reserva.

**Entonces** el sistema muestra únicamente sus turnos, con fecha, lugar, estado, detalle y requisitos de acceso.

**Caso alternativo:** si no existen reservas, muestra un aviso; una reserva cancelada no ofrece acciones incompatibles.

### TU-CU-05 - Reprogramar turno

**Dado** un turno vigente y modificable.

**Cuando** el solicitante elige una nueva fecha y franja, y confirma el cambio.

**Entonces** el sistema valida nuevamente las restricciones, actualiza el turno y libera el cupo anterior.

**Caso alternativo:** si la nueva franja está completa o el turno no es modificable, conserva sin cambios la reserva original.

### TU-CU-06 - Cancelar turno

**Dado** un turno vigente y cancelable.

**Cuando** el solicitante confirma la cancelación.

**Entonces** el sistema cambia el estado a cancelado, libera el cupo correspondiente e informa el resultado.

**Caso alternativo:** si el solicitante desiste, el turno permanece igual; un turno usado o ya cancelado no vuelve a modificarse.

### TU-CU-07 - Buscar turno

**Dado** un guardia autenticado y habilitado para consultar los accesos de su instalación.

**Cuando** busca por nombre, documento o código.

**Entonces** el sistema filtra los turnos del día y permite seleccionar la reserva correcta.

**Caso alternativo:** si no hay coincidencias, informa que no existen resultados; si hay varias, muestra los datos necesarios para distinguirlas.

### TU-CU-08 - Verificar autorización

**Dado** un guardia autenticado con una reserva localizada.

**Cuando** coteja la identidad y consulta el código del turno.

**Entonces** el sistema comprueba estado, instalación, sector, fecha y horario, y muestra Autorizado, Pendiente o Denegado.

**Caso alternativo:** una reserva pendiente, cancelada, inexistente o fuera de horario no habilita el ingreso ni registra por sí sola una entrada.

### TU-CU-09 - Registrar ingreso

**Dado** un turno autorizado, una identidad verificada y una persona que todavía no figura dentro de la instalación.

**Cuando** el guardia selecciona Registrar ingreso.

**Entonces** el sistema registra fecha, hora y guardia responsable, marca la presencia como Dentro de la instalación y actualiza la ocupación.

**Caso alternativo:** bloquea el registro si ya existe un ingreso activo, la autorización dejó de ser válida o la capacidad está completa.

### TU-CU-10 - Registrar egreso

**Dado** una persona con un ingreso activo.

**Cuando** el guardia selecciona Registrar salida.

**Entonces** el sistema registra la fecha y hora del egreso, marca la presencia como Finalizado y disminuye la ocupación.

**Caso alternativo:** si no existe un ingreso previo o ya se registró la salida, no crea un egreso duplicado.

### TU-CU-11 - Configurar sector

**Dado** un administrador autenticado con permisos de configuración.

**Cuando** modifica capacidad u horarios y confirma los valores.

**Entonces** el sistema valida y guarda la configuración del sector.

**Caso alternativo:** rechaza valores inválidos y no aplica cambios que generen conflictos con reservas existentes.

### TU-CU-12 - Gestionar autorizaciones

**Dado** un administrador autenticado y una persona registrada.

**Cuando** modifica los sectores o niveles permitidos y confirma.

**Entonces** el sistema valida y guarda la autorización actualizada.

**Caso alternativo:** ante una persona inexistente, permiso inválido o cancelación de la operación, conserva los permisos anteriores.

## 7.3 Trazabilidad con los requerimientos funcionales

| Caso de uso | Requerimientos funcionales principales |
|---|---|
| CU-01 | RF-01 y RF-02 |
| CU-02 | RF-03 y RF-04 |
| CU-03 | RF-05, RF-06 y RF-07 |
| CU-04 | RF-08 y RF-09 |
| CU-05 | RF-10 y RF-11 |
| CU-06 | RF-12 y RF-13 |
| CU-07 | RF-14 |
| CU-08 | RF-15 y RF-16 |
| CU-09 | RF-17, RF-18 y RF-19 |
| CU-10 | RF-20 y RF-21 |
| CU-11 | RF-22 |
| CU-12 | RF-23 |

Estas pruebas cubren los flujos principales y alternativos definidos en el punto 3. Los requerimientos sobre notificaciones y reportes se consideran fuera de esta primera tanda porque aparecen asociados a historias de usuario todavía no convertidas en casos de uso formales.
