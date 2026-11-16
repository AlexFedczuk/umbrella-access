# Umbrella Access — Prototipo funcional

Sistema de gestión de turnos y control de ingreso a instalaciones restringidas de Umbrella Corporation (universo *Resident Evil*).
Prototipo académico del Trabajo Práctico de **Metodología de Sistemas I**, construido a partir de las 12

> La autenticación y todos los datos son **simulados**. No hay servidor ni base de datos: no ofrece seguridad real.

---

## 1. Cómo ejecutarlo

1. Copiar la carpeta `proyecto/` completa a cualquier computadora.
2. Abrir **`index.html`** con doble clic (verificado en Google Chrome y Microsoft Edge; Firefox no fue probado).
3. Iniciar sesión con una de las cuentas de demostración.

No requiere instalación, Internet, Node.js, npm ni servidor web. Funciona abriendo el archivo directamente (`file://`).

## 2. Tecnologías

- HTML5, CSS3 y JavaScript Vanilla (scripts clásicos, sin módulos ES).
- `localStorage` para la persistencia de datos y de la sesión.
- Íconos SVG y logotipo dibujados localmente 
## 3. Cuentas de demostración

También pueden consultarse en el login, desplegando **“Cuentas de demostración”** (al hacer clic en una fila se completa el formulario).

| Perfil | Nombre | Identificación | Contraseña |
|---|---|---|---|
| Solicitante · Empleado | Dr. Marcus Vance | `UC-8842-BIO` | `vance123` |
| Solicitante · Visitante | Dr. Albert Wesker | `VIS-0001-AUD` | `wesker123` |
| Solicitante · Proveedor | Elena Rostova | `PROV-9041-CRIO` | `rostova123` |
| Seguridad | Oficial Jill Valentine | `UC-1014-SEC` | `valentine123` |
| Administrador | Lic. A. Ashford | `UC-0002-ADM` | `ashford123` |

Cuentas adicionales (para enriquecer los datos): Carlos Oliveira `UC-5520-MANT` / `oliveira123`, Dra. Rebecca Chambers `VIS-3312-MED` / `chambers123`, Miguel Santos `PROV-7730-LOG` / `santos123` y Nikolai Ginovaef `UC-6603-OPS` / `ginovaef123` (**cuenta inactiva**: sirve para probar el rechazo del login).

La identificación no distingue mayúsculas/minúsculas. La contraseña sí.

## 4. Perfiles y pantallas

| Perfil | Pantallas |
|---|---|
| Todos | 1. Inicio de sesión |
| Solicitante | 2. Panel principal · 3. Solicitar turno (5 pasos) · 4. Mis turnos · 5. Detalle del turno · 6. Reprogramación · 12. Notificaciones |
| Seguridad | 7. Panel de Control de Accesos · 8. Verificación de autorización |
| Administrador | 9. Panel de Administración · 10. Instalaciones y Sectores · 11. Usuarios y Autorizaciones |

Cada perfil tiene su propio menú lateral. Si se intenta abrir una sección de otro perfil (por ejemplo escribiendo `#/admin/panel` en la barra de direcciones), el sistema la bloquea y redirige al panel propio.

## 5. Funcionalidades implementadas

**Solicitante**
- Panel con datos del usuario, nivel de acceso, próximo turno confirmado y solicitudes en trámite.
- Solicitud en 5 pasos vinculados: instalación → sector (solo los de esa instalación) → motivo → fecha y franja → confirmación.
  - Calendario sin fechas pasadas, días no habilitados ni días sin cupo; franjas con cupos libres calculados.
  - Código único `TUR-AAAA-NNNN` al confirmar.
- Mis turnos: búsqueda, filtros por estado y por período (próximos/anteriores), acciones según el estado.
- Detalle con código alfanumérico (sin QR), requisitos, historial y acciones.
- Reprogramación con disponibilidad en tiempo real y confirmación; libera el cupo anterior.
- Cancelación con confirmación; libera el cupo.
- Notificaciones individuales: filtros, marcar una o todas como leídas, contador en el menú.

**Seguridad**
- Panel con indicadores calculados desde los registros: ingresos programados, personas dentro y pendientes de ingreso; listado del día con buscador, filtros, fecha e instalación.
- Verificación por código de turno o identificación del solicitante (también por nombre), con lista de validaciones.
- Registro **manual** de ingreso y egreso (fecha, hora, guardia y turno), con actualización de la ocupación.

**Administrador**
- Panel con turnos del día, solicitudes pendientes, instalaciones activas y accesos registrados (todo calculado).
- Aprobación / rechazo (con motivo opcional) y revisión detallada; se notifica al solicitante.
- Instalaciones y sectores: búsqueda y filtros; edición de capacidad, horario, duración de franja, fines de semana, nivel requerido, aprobación obligatoria y habilitación.
- Usuarios y autorizaciones: búsqueda y filtros; consulta de permisos; modificación de nivel, sectores habilitados y estado de la cuenta.

## 6. Reglas de negocio (supuestos documentados)

La documentación del punto 3 deja varias reglas “a confirmar con el cliente”. Para la demostración se definió:

1. **Franjas horarias**: cada sector tiene apertura, cierre y duración de franja; las franjas se generan con 30 minutos de intervalo (ej.: 08:00-11:00, 11:30-14:30, 15:00-18:00). Los sectores pueden operar de lunes a viernes o todos los días.
2. **Capacidad**: es el máximo de reservas por franja. Cuentan los turnos *Pendientes* y *Confirmados*; los *Cancelados* y *Denegados* liberan el cupo. Además, el ingreso físico no puede superar la capacidad del sector.
3. **Autorización al solicitar**:
   - Nivel del usuario menor al requerido → no puede solicitar el sector.
   - Sector incluido en sus autorizaciones y sin aprobación obligatoria → **Confirmado automáticamente**.
   - Cualquier otro caso (sector fuera de sus autorizaciones o que exige aprobación) → **Pendiente** de aprobación administrativa.
4. **Anticipación**: se puede reservar desde hoy hasta 60 días. Cancelar o reprogramar solo es posible antes del inicio de la franja y si no hubo ingreso.
5. **Reprogramación**: conserva el código y el estado de autorización (Confirmado o Pendiente).
6. **Ingreso**: se permite si el turno está Confirmado, el usuario está activo con nivel suficiente y el sector sigue autorizado (o el turno fue aprobado por Administración), la fecha es hoy, la hora está entre **30 minutos antes del inicio** y el fin de la franja, el sector tiene capacidad y la persona no tiene otro ingreso activo.
7. **Estados**: los del turno (*Pendiente, Confirmado, Denegado, Cancelado*) son independientes del estado de presencia (*Sin ingreso, Dentro, Finalizado*), que se deriva de los registros de acceso.
8. **Cambios administrativos**: si una modificación de sector afecta reservas vigentes (franja que deja de existir, capacidad menor a las reservas, sector a mantenimiento, nivel mayor al de los titulares, fines de semana), **no se aplica** y se muestra la lista de conflictos. Los cambios de autorización de usuarios se reflejan inmediatamente en las verificaciones de Seguridad. Un sector solo puede habilitarse a un usuario con nivel suficiente; el administrador no puede modificar su propia cuenta.

## 7. Datos de demostración

Se generan automáticamente en la primera ejecución **en relación con la fecha y hora actuales**, por lo que siempre hay turnos de hoy, futuros e históricos:

- 3 instalaciones y 10 sectores con distintas capacidades, horarios y niveles (uno en mantenimiento, uno con cupo completo).
- 9 usuarios: empleados, visitantes, proveedores, seguridad, administración y una cuenta inactiva.
- Turnos confirmados, pendientes, denegados y cancelados; una persona dentro de la instalación y otras que ya egresaron.
- Notificaciones leídas y no leídas.
- El turno **`TUR-AAAA-0941`** de Marcus Vance siempre corresponde a la franja vigente de hoy, para demostrar el ingreso (si el laboratorio está cerrado en ese momento, se usa un sector de 24 horas).

### Restablecer los datos

Usar **“Restablecer datos de demostración”** (en el login dentro de “Cuentas de demostración”, o al pie del menú lateral). Pide confirmación, borra todos los cambios y regenera los datos para la fecha y hora actuales. Se recomienda hacerlo antes de cada presentación.

## 8. Recorridos sugeridos para la demostración

- **Flujo A — Solicitante**: Marcus inicia sesión → panel → Mis turnos → Solicitar turno → ver estado → reprogramar o cancelar → cerrar sesión.
- **Flujo B — Autorización**: Elena solicita *Subnivel -6 Criocámaras* (exige aprobación) → queda Pendiente → cierra sesión → Ashford la aprueba o rechaza en el Panel de Administración → Elena vuelve a ingresar y ve el nuevo estado y la notificación.
- **Flujo C — Seguridad**: Jill busca `TUR-AAAA-0941` (o `UC-8842-BIO`) en Verificación → Registrar ingreso → el contador “Personas dentro” aumenta → Registrar salida → el turno queda Finalizado y la ocupación disminuye.

## 9. Funcionalidades excluidas del MVP

No se implementan:

- Autenticación biométrica, reconocimiento facial, escaneo de retina o huellas.
- Escaneo de códigos QR o de barras, lectores de credenciales, torniquetes, sensores o apertura automática de puertas.
- Envío de correos o notificaciones externas (las notificaciones son internas).
- Alta de nuevas instalaciones, sectores o usuarios; auditoría avanzada, reportes exportables y tableros analíticos.
- Historias clínicas, investigaciones, pagos o información científica.

## 10. Adaptaciones respecto de los diseños

- *“Validando protocolo biométrico”*, *“Escanear QR de Pase”*, el QR/código de barras del detalle y la “credencial QR” se reemplazaron por la **verificación manual mediante código alfanumérico**.
- Se quitaron elementos decorativos sin función: selector de sede del login, temporizador “ventana expira”, gráfico de ocupación histórica, indicadores DEFCON/latencia y botones de alta (“Nuevo sector”, “Registrar nuevo usuario”).
- Los contadores fijos de los bocetos (24, 10, 6, 124 perfiles…) se reemplazaron por valores **calculados** desde los datos.
- Se corrigieron menús laterales rotos o duplicados de algunas exportaciones; cada perfil tiene una navegación coherente.
- **Inconsistencia de Albert Wesker**: figura como “Directivo” (`UC-0001-DIR`) en usuarios y como “Visitante” en seguridad; se adoptó *Visitante* (según el enunciado) con la identificación `VIS-0001-AUD`, coherente con el prefijo de visitantes (`VIS-3312-MED`).
- Identificaciones creadas por no figurar en los bocetos: `UC-0002-ADM` (Ashford), `PROV-7730-LOG` (Miguel Santos) y `UC-6603-OPS` (cuenta inactiva).
- Se agregó una sección discreta de “Cuentas de demostración” y la opción de restablecer datos.

## 11. Limitaciones de la simulación

- Los datos viven en el `localStorage` **de cada navegador**: no se comparten entre computadoras ni entre navegadores distintos. Sí se comparten entre todas las pestañas del mismo navegador (los perfiles ven la misma información).
- Las contraseñas se guardan en texto plano dentro del navegador; no hay cifrado ni seguridad real.
- La fecha y hora provienen del reloj de la computadora.
- Si el navegador bloquea el almacenamiento local (por ejemplo, ciertos modos privados), la aplicación funciona en memoria y los cambios se pierden al recargar.

## 12. Estructura

```
proyecto/
├── index.html            Punto de entrada
├── README.md
├── assets/logo.svg       Logotipo Umbrella (SVG local)
├── css/styles.css        Estilos
└── js/
    ├── utils.js          Fechas, formatos y utilidades
    ├── icons.js          Íconos SVG locales
    ├── storage.js        localStorage + datos de demostración
    ├── rules.js          Reglas de negocio (turnos, autorizaciones, ingresos, configuración)
    ├── ui.js             Estructura, menús por rol, insignias, modales y avisos
    ├── auth.js           Autenticación simulada + pantalla de login
    ├── turns.js          Pantallas del Solicitante
    ├── notifications.js  Centro de notificaciones
    ├── security.js       Pantallas de Seguridad
    ├── admin.js          Pantallas de Administración
    └── app.js            Enrutador por hash y control de acceso por rol
```
