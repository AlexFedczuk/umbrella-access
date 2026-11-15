# Punto 7 - Pruebas de los casos de uso

## 7.1 Introduccion

En este punto se proponen pruebas para los doce casos de uso del punto 3. La idea es comprobar que las funciones principales de Umbrella Access respondan correctamente y que también se contemplen algunos errores frecuentes.

Las pruebas están escritas de forma simple. Cuando el sistema se implemente, podrán transformarse en pruebas unitarias dentro del lenguaje y herramienta que el equipo elija.

## 7.2 Casos de prueba

### TU-01 - Iniciar sesión

- **Caso de uso:** CU-01 Iniciar sesión.
- **Dado:** un usuario registrado y activo.
- **Cuando:** ingresa correctamente su identificación y contraseña.
- **Entonces:** el sistema permite el acceso y muestra el panel correspondiente a su perfil.
- **Si ocurre un error:** con datos incorrectos, el acceso se rechaza y se muestra un mensaje.

### TU-02 - Consultar disponibilidad

- **Caso de uso:** CU-02 Consultar disponibilidad.
- **Dado:** un sector con horarios y capacidad configurados.
- **Cuando:** el solicitante elige una fecha.
- **Entonces:** el sistema muestra los horarios disponibles.
- **Si ocurre un error:** los horarios completos aparecen como no disponibles.

### TU-03 - Solicitar turno

- **Caso de uso:** CU-03 Solicitar turno.
- **Dado:** un solicitante autorizado y una franja disponible.
- **Cuando:** completa los datos y confirma la solicitud.
- **Entonces:** el sistema registra el turno, genera un código y muestra su estado.
- **Si ocurre un error:** si falta un dato, no hay cupo o falta autorización, la solicitud no se confirma.

### TU-04 - Consultar turnos

- **Caso de uso:** CU-04 Consultar turnos.
- **Dado:** un solicitante con uno o más turnos registrados.
- **Cuando:** ingresa a la sección Mis turnos.
- **Entonces:** puede ver sus reservas, estados, fechas y detalles.
- **Si ocurre un error:** si no tiene reservas, el sistema muestra un aviso y no muestra turnos de otras personas.

### TU-05 - Reprogramar turno

- **Caso de uso:** CU-05 Reprogramar turno.
- **Dado:** un turno vigente que puede modificarse.
- **Cuando:** el solicitante elige otra fecha y horario disponible y confirma.
- **Entonces:** el turno se actualiza y se libera el horario anterior.
- **Si ocurre un error:** si el nuevo horario está completo, se conserva el turno original.

### TU-06 - Cancelar turno

- **Caso de uso:** CU-06 Cancelar turno.
- **Dado:** un turno vigente y cancelable.
- **Cuando:** el solicitante confirma la cancelación.
- **Entonces:** el estado pasa a cancelado y se libera el lugar.
- **Si ocurre un error:** un turno ya usado o ya cancelado no se modifica.

### TU-07 - Buscar turno

- **Caso de uso:** CU-07 Buscar turno.
- **Dado:** un guardia que inició sesión.
- **Cuando:** busca por nombre, documento o código.
- **Entonces:** el sistema muestra las reservas que coinciden con la búsqueda.
- **Si ocurre un error:** si no hay coincidencias, se informa que no se encontraron resultados.

### TU-08 - Verificar autorización

- **Caso de uso:** CU-08 Verificar autorización.
- **Dado:** una reserva localizada y una persona presente en el puesto de control.
- **Cuando:** el guardia revisa los datos del turno y la identidad.
- **Entonces:** el sistema indica si el acceso está autorizado, pendiente o denegado.
- **Si ocurre un error:** una reserva cancelada, fuera de horario o con datos incorrectos no permite el ingreso.

### TU-09 - Registrar ingreso

- **Caso de uso:** CU-09 Registrar ingreso.
- **Dado:** un turno autorizado y una persona correctamente identificada.
- **Cuando:** el guardia registra el ingreso.
- **Entonces:** se guarda la fecha y hora, y se actualiza la ocupación del sector.
- **Si ocurre un error:** no se registra el ingreso si la capacidad está completa o si ya existía un ingreso activo.

### TU-10 - Registrar egreso

- **Caso de uso:** CU-10 Registrar egreso.
- **Dado:** una persona que tiene un ingreso activo.
- **Cuando:** el guardia registra la salida.
- **Entonces:** se guarda la fecha y hora del egreso y se reduce la ocupación.
- **Si ocurre un error:** no se registra una salida si no había un ingreso previo.

### TU-11 - Configurar sector

- **Caso de uso:** CU-11 Configurar sector.
- **Dado:** un administrador con permiso para modificar la configuración.
- **Cuando:** cambia la capacidad o los horarios y confirma.
- **Entonces:** el sistema guarda los nuevos datos.
- **Si ocurre un error:** no se guardan valores inválidos, como una capacidad negativa o un horario incorrecto.

### TU-12 - Gestionar autorizaciones

- **Caso de uso:** CU-12 Gestionar autorizaciones.
- **Dado:** un administrador y una persona registrada.
- **Cuando:** modifica los sectores o el nivel de autorización y confirma.
- **Entonces:** se guardan los nuevos permisos.
- **Si ocurre un error:** si la persona no existe o los datos son incorrectos, se mantienen los permisos anteriores.

## 7.3 Relación con los requerimientos

| Prueba | Caso de uso | Requerimientos relacionados |
|---|---|---|
| TU-01 | CU-01 Iniciar sesión | RF-01 y RF-02 |
| TU-02 | CU-02 Consultar disponibilidad | RF-03 y RF-04 |
| TU-03 | CU-03 Solicitar turno | RF-05, RF-06 y RF-07 |
| TU-04 | CU-04 Consultar turnos | RF-08 y RF-09 |
| TU-05 | CU-05 Reprogramar turno | RF-10 y RF-11 |
| TU-06 | CU-06 Cancelar turno | RF-12 y RF-13 |
| TU-07 | CU-07 Buscar turno | RF-14 |
| TU-08 | CU-08 Verificar autorización | RF-15 y RF-16 |
| TU-09 | CU-09 Registrar ingreso | RF-17, RF-18 y RF-19 |
| TU-10 | CU-10 Registrar egreso | RF-20 y RF-21 |
| TU-11 | CU-11 Configurar sector | RF-22 |
| TU-12 | CU-12 Gestionar autorizaciones | RF-23 |

## 7.4 Resultado esperado

La prueba se considerará aprobada cuando el sistema realice el comportamiento indicado. Si ocurre alguno de los errores mencionados, también debe responder de la manera esperada sin guardar datos incorrectos.

Por el momento, este documento presenta el diseño de las pruebas. La ejecución dependerá de que el equipo implemente el sistema y seleccione una herramienta de pruebas.
