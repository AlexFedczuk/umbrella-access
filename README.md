# Umbrella Access

Sistema de gestión de turnos de acceso a instalaciones restringidas de Umbrella Corporation.

## Descripción

Umbrella Access permite gestionar el ingreso programado de empleados, visitantes y proveedores a sectores restringidos. El sistema valida autorizaciones, disponibilidad horaria, capacidad máxima y requisitos de seguridad.

También permite cancelar y reprogramar turnos, enviar notificaciones y registrar ingresos y egresos.

## Prototipo funcional

[![Abrir Umbrella Access](02-mauricio-gonzales-flores/PaginaMockup/proyecto/assets/boton-abrir.svg)](02-mauricio-gonzales-flores/PaginaMockup/proyecto/index.html)

El botón abre el [`index.html`](02-mauricio-gonzales-flores/PaginaMockup/proyecto/index.html) del prototipo. No requiere instalación ni Internet: funciona en Google Chrome o Microsoft Edge.

**Cómo abrirlo según dónde se lea este README:**

- **Desde el explorador de archivos:** entrar a `02-mauricio-gonzales-flores/PaginaMockup/proyecto/` y hacer doble clic en `index.html`.
- **Desde VS Code:** clic derecho sobre `index.html` → *Reveal in File Explorer* (*Mostrar en el Explorador de archivos*) → doble clic. Un clic en el botón dentro de VS Code abre el código, no la página.
- **Desde GitHub:** el botón muestra el código fuente. Para verlo funcionando hay que descargar o clonar el repositorio y abrir el archivo localmente.

### Credenciales de demostración

| Perfil | Nombre | Identificación | Contraseña |
|---|---|---|---|
| Solicitante · Empleado | Dr. Marcus Vance | `UC-8842-BIO` | `vance123` |
| Solicitante · Visitante | Dr. Albert Wesker | `VIS-0001-AUD` | `wesker123` |
| Solicitante · Proveedor | Elena Rostova | `PROV-9041-CRIO` | `rostova123` |
| Seguridad | Oficial Jill Valentine | `UC-1014-SEC` | `valentine123` |
| Administrador | Lic. A. Ashford | `UC-0002-ADM` | `ashford123` |

- La identificación no distingue mayúsculas de minúsculas; la contraseña sí.
- En la pantalla de inicio de sesión, la sección desplegable **"Cuentas de demostración"** completa el formulario con un clic.
- Cuenta inactiva para probar el rechazo del inicio de sesión: `UC-6603-OPS` / `ginovaef123`.
- Antes de cada presentación conviene usar **"Restablecer datos de demostración"**, así los turnos de hoy coinciden con la fecha y hora reales.

El detalle de funcionalidades, reglas de negocio y limitaciones está en el [README del prototipo](02-mauricio-gonzales-flores/PaginaMockup/proyecto/README.md).

## Objetivo general

Diseñar un sistema que permita gestionar de manera segura, ordenada y eficiente los turnos de acceso a las instalaciones restringidas de Umbrella Corporation.

## Objetivos específicos

- Centralizar la solicitud, consulta, cancelación y reprogramación de turnos.
- Validar automáticamente las autorizaciones de acceso.
- Evitar que se supere la capacidad máxima de cada sector.
- Reducir el tiempo de gestión de los turnos.
- Registrar digitalmente los ingresos y egresos.

## Integrantes

- Alex Yago Fedczuk
- Mauricio Gonzales Flores
- Abigail Victoria Medina Bruno
- Agustin Mena

## Organización del repositorio

- `01-alex-yago-fedczuk/`: Punto 1, 4 y 7.
- `02-mauricio-gonzales-flores/`: Punto 2 y colaboración en el punto 3. Incluye el prototipo funcional en `PaginaMockup/proyecto/`.
- `03-abigail-victoria-medina-bruno/`: Punto 5 y 6.
- `04-agustin-mena/`: Punto 8.
- `documentos/`: Material común del proyecto.
- `entrega-final/`: Versión integrada para entregar.

## Alcance

El sistema no incluye historias clínicas, investigaciones, tratamientos, facturación, pagos ni información científica confidencial.

## Materia

Metodología de Sistemas I