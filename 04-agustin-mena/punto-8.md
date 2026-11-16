# Punto 8 - Pruebas para los requerimientos no funcionales

## 8.1 Introducción

En este punto se indica qué tipo de prueba corresponde a cada requerimiento no funcional (RNF) definido en el punto 3.c. Los requerimientos no funcionales no describen una función concreta del sistema, sino condiciones de calidad que afectan al sistema en su conjunto (seguridad, rendimiento, compatibilidad, etc.). Por eso no se validan con las pruebas de los casos de uso del punto 7, sino con pruebas no funcionales.

## 8.2 Tipos de pruebas utilizados

Se utilizan los tipos de pruebas no funcionales vistos en clase:

| Tipo de prueba | Qué evalúa |
|---|---|
| Recuperación | Cómo responde el sistema ante una falla y si logra restablecer sus datos y procesos correctamente. |
| Rendimiento | Cómo se comporta el sistema (por ejemplo, sus tiempos de respuesta) bajo distintas cargas de trabajo. |
| Carga | Un tipo de prueba de rendimiento: evalúa el sistema con la cantidad de usuarios u operaciones esperada en condiciones reales. |
| Estrés | Hasta qué nivel de exigencia soporta el sistema antes de fallar. |
| Seguridad | Si el sistema es vulnerable a accesos indebidos, ataques u otras amenazas. |
| Usabilidad | Si los usuarios pueden usar la interfaz para completar sus tareas de forma eficaz e intuitiva. |
| Compatibilidad | Si el sistema funciona como se espera en distintos dispositivos, sistemas operativos, navegadores y redes. |

## 8.3 Pruebas por requerimiento no funcional

| ID | Requerimiento no funcional | Tipo de prueba | Justificación | Cómo se probaría |
|---|---|---|---|---|
| RNF-01 | El sistema debe restringir las funciones según el perfil autenticado. | Seguridad | Se busca impedir que un usuario acceda a funciones que no le corresponden a su perfil. | Iniciar sesión como Solicitante e intentar acceder a funciones de Personal de Seguridad o de Administrador, incluso ingresando la dirección de la página manualmente. El sistema debe bloquear el acceso. |
| RNF-02 | El sistema debe responder las búsquedas de reservas en un máximo de 3 segundos bajo una carga de uso normal definida para la prueba. | Rendimiento y Carga | Fija un tiempo máximo de respuesta (rendimiento) que debe cumplirse con una cantidad normal de usuarios usando el sistema (carga). | Medir el tiempo de respuesta de la búsqueda de reservas con un solo usuario y luego simulando la cantidad de usuarios simultáneos definida como carga normal. En ambos casos la respuesta debe tardar 3 segundos o menos. |
| RNF-03 | El sistema debe identificar cada acción principal con un botón o enlace que contenga una etiqueta textual legible. | Usabilidad | Apunta a que los usuarios encuentren y entiendan las acciones de la interfaz sin ayuda. | Pedirle a usuarios de prueba que realicen tareas comunes (solicitar un turno, cancelarlo, registrar un ingreso) y observar si identifican los botones correctos sin asistencia. |
| RNF-04 | El sistema debe visualizarse correctamente en las versiones vigentes de Chrome, Edge y Firefox de escritorio. | Compatibilidad | Exige que el sistema funcione igual en distintos navegadores. | Recorrer las pantallas principales en los tres navegadores y comprobar que se vean y funcionen de la misma manera. |
| RNF-05 | El sistema debe estar disponible para consultar turnos durante las 24 horas, salvo ventanas de mantenimiento programadas. | Recuperación (complementada con Estrés) | Para mantener la disponibilidad, el sistema debe poder recuperarse ante una caída sin perder información. La prueba de estrés permite conocer en qué punto podría dejar de estar disponible. | Simular una caída del servidor o de la base de datos y verificar que el sistema vuelva a funcionar y conserve los turnos e ingresos registrados. Además, aumentar la exigencia por encima de la carga normal para identificar el límite del sistema. |
| RNF-06 | El sistema debe proteger mediante cifrado las comunicaciones que transporten credenciales o datos personales. | Seguridad | Busca evitar que terceros puedan leer las contraseñas o los datos personales mientras viajan por la red. | Inspeccionar las comunicaciones durante el inicio de sesión y la solicitud de un turno, y comprobar que viajen cifradas (HTTPS) y que la contraseña no pueda leerse en texto plano. |
| RNF-07 | El sistema debe contar con una guía de uso para Solicitante y Personal de Seguridad. | Usabilidad | La guía tiene como fin que los usuarios puedan aprender a usar el sistema por su cuenta. | Entregar la guía a usuarios que no conocen el sistema y verificar si pueden completar las tareas principales usando solamente esa guía. |

## 8.4 Resumen

| Tipo de prueba | Requerimientos no funcionales |
|---|---|
| Seguridad | RNF-01, RNF-06 |
| Rendimiento | RNF-02 |
| Carga | RNF-02 |
| Usabilidad | RNF-03, RNF-07 |
| Compatibilidad | RNF-04 |
| Recuperación | RNF-05 |
| Estrés | RNF-05 |

## 8.5 Observaciones

- El RNF-07 corresponde a documentación, una categoría que no tiene un tipo de prueba propio entre los vistos en clase. Se lo asigna a usabilidad porque el objetivo de la guía es que los usuarios puedan usar el sistema de forma autónoma. Además, la guía puede verificarse mediante una revisión de su contenido.
- Para que la prueba de carga del RNF-02 sea medible, es necesario definir una cantidad concreta de usuarios simultáneos como "carga normal". Ese valor debe confirmarse con el cliente.
- Si en el punto 3.c se agregan o modifican requerimientos no funcionales, este punto debe actualizarse con los mismos identificadores.
