# Plan de acción: aplicación móvil por tienda

Última actualización: 11 de noviembre de 2026.

## Objetivo

Permitir que el administrador de cada inquilino solicite desde su panel un APK Android con el nombre, el icono y la identidad visual de su tienda. La aplicación debe conectarse a la API compartida, trabajar exclusivamente con los datos del inquilino y poder descargarse para compartirla.

La app existente está desarrollada en **React Native**. Los cambios de colores, logos y contenido dentro de la app deberán obtenerse desde la configuración de la tienda siempre que sea posible. El nombre y el icono de instalación forman parte del APK y requieren una nueva compilación y actualización de la aplicación cuando cambian.

## Reglas de trabajo

- Trabajar en la rama `livison` tanto de web como de móvil. La copia móvil está en `ecommerce-movil/` y es un repositorio independiente, ignorado por Git en el repositorio web.
- Conservar los cambios existentes y revisar `git status` en ambos repositorios antes de modificar, guardar o integrar trabajo.
- Ejecutar las pruebas correspondientes al terminar cada cambio y registrar el resultado real. No marcar una fase como terminada solo porque compile.
- No aplicar migraciones a una base de producción sin haberlas probado en una base aislada y contar con un respaldo y procedimiento de reversión.
- No incorporar claves de firma, contraseñas ni archivos de configuración privados al repositorio. La clave temporal usada para el piloto no sirve como clave de producción.
- Evitar transacciones reales durante las pruebas de compra; utilizar datos y medios de prueba.

## Estado actual

- [x] Se guardó y envió el commit web `c852691`, con mensaje `proyecto estable`, a `origin/livison`.
- [x] Se prepararon ramas locales `livison` de web y móvil con el `main` remoto consultado al inicio del trabajo.
- [x] El endpoint público de apariencia puede combinar el nombre y el logo de la empresa con la apariencia del mismo inquilino. La barra de navegación web y el contexto móvil comenzaron a consumir estos datos.
- [x] Se vinculó el token JWT nuevo al inquilino, se eliminaron contraseñas fijas aceptadas como alternativa y se añadieron pruebas de aislamiento. **Los tokens anteriores tendrán que iniciar sesión nuevamente cuando se despliegue el cambio.**
- [x] La app móvil admite una configuración de tienda y API; en modo de tienda fija limita el inicio de sesión y las peticiones a esa tienda.
- [x] Se creó un generador manual de APK y se documentó en `ecommerce-movil/docs/generar-apk.md`. Este generador todavía no está integrado con el panel.
- [x] La última ejecución de la suite del backend pasó con 43 pruebas. En la última ejecución registrada de móvil pasaron 4 pruebas y compilaron el backend y el frontend web. Estas comprobaciones no sustituyen la prueba en teléfono ni prueban todo el flujo.
- [x] Se preparó un almacenamiento opcional de apariencia en PostgreSQL, con importación y exportación documentadas en `backend/docs/migracion-apariencia.md`. El modo de archivo sigue activo por defecto; aún no se ha aplicado ni probado la migración en PostgreSQL real.
- [x] La lectura, actualización, creación de la apariencia inicial de una tienda y el respaldo/restauración de su apariencia usan el almacenamiento seleccionado. En el respaldo de apariencia se limita la información al inquilino activo; falta probar el flujo completo contra PostgreSQL real.
- [x] El importador valida el JSON antes de conectarse y, al aplicar, usa una transacción; no sobrescribe registros existentes y revierte la operación si encuentra datos diferentes. El exportador preparado no sobrescribe archivos existentes. Ambos requieren pruebas con PostgreSQL real.
- [x] La validación sin conexión del importador encontró tres configuraciones válidas y no modificó ninguna base de datos.
- [ ] Completar y comprobar la compilación del APK piloto al final, cuando la configuración esté lista, según la indicación del usuario. No se ha confirmado un APK instalable ni se ha instalado una versión piloto en el teléfono.
- [ ] Completar las fases de persistencia, automatización y panel descritas abajo.

Los cambios posteriores a `proyecto estable` están sin commit ni push en ambos repositorios. El dispositivo Android RMX3491 fue detectado por ADB en una comprobación anterior; verificar nuevamente su conexión antes de usarlo.

## Fase 1. Unificar el diseño de las tiendas

**Estado: en curso.**

1. [ ] Inventariar nombre, logos, colores, fuentes, banners, textos y otros elementos visuales de cada tienda. Identificar los valores guardados y los que siguen definidos en el código web o móvil.
2. [ ] Definir una configuración común por inquilino y la prioridad entre los datos de empresa, apariencia y valores predeterminados. Evitar que una tienda desconocida herede accidentalmente la identidad de otra.
3. [ ] Trasladar a esa configuración los valores necesarios de Dressly, Urbanly y Aura. Mantener su aspecto actual al hacer el cambio.
4. [ ] Hacer que la web y la app consuman la misma configuración para los elementos compartidos. Adaptar las pantallas móviles a ella; el CSS y la distribución de la web no se aplican automáticamente en React Native.
5. [ ] Definir las imágenes y fuentes compatibles con Android, los valores de respaldo sin conexión y el recurso que se usará para generar el icono de instalación.
6. [ ] Probar la actualización de apariencia y comparar visualmente las tres tiendas y una tienda nueva, tanto en web como en móvil.

**Criterio de cierre:** los elementos acordados tienen una única fuente por tienda, sin regresiones visuales ni datos de otra tienda.

## Fase 2. Persistencia y backend

**Estado: parcial.** La apariencia se guarda por defecto en `backend/data/tenants_appearance.json`. Se preparó un modo PostgreSQL y un importador, pero todavía no se ha probado ni activado la migración en una base real.

1. [ ] Diseñar dónde se guardarán de forma persistente la apariencia, la identidad Android por tienda y el historial de compilaciones. Definir el alcance de cada dato en la arquitectura multiinquilino existente.
2. [ ] Verificar en PostgreSQL real el esquema y el importador preparados: deben preservar las configuraciones actuales, ser repetibles y no sobrescribir datos posteriores sin una decisión explícita.
3. [ ] Preparar respaldo, verificación de cantidades y contenido, y procedimiento de reversión. Probar la migración y la restauración en PostgreSQL aislado antes de cualquier despliegue. Docker no era accesible para la cuenta al último intento; resolver el entorno de pruebas sin utilizar la base productiva.
4. [ ] Probar en PostgreSQL la creación de nuevas tiendas, lectura y actualización de apariencia, y respaldo/restauración adaptados para utilizar el almacenamiento seleccionado.
5. [ ] Definir la información de los trabajos: inquilino, versión de código y configuración, estado, fechas, resultado, errores y ubicación del artefacto. Evitar exponer secretos en registros o respuestas.
6. [ ] Comprobar que el permiso para configurar apariencia y solicitar compilaciones corresponda al administrador autenticado y a su inquilino. Probar explícitamente intentos de acceso entre tiendas.
7. [ ] Ejecutar pruebas unitarias y de integración de migración, persistencia, respaldo, autorización y aislamiento.

**Criterio de cierre:** la configuración sobrevive a reinicios y múltiples instancias, las tiendas existentes conservan sus datos y las pruebas de aislamiento y recuperación pasan.

## Fase 3. Adaptar la aplicación móvil

**Estado: en curso.** Existe una configuración de tienda y URL de API, y la app puede limitar el login y las peticiones a esa tienda. La aplicación visual completa todavía no está terminada.

1. [ ] Revisar todas las pantallas y sustituir los colores, logos, nombres, imágenes y textos de tienda que sigan fijos cuando deban provenir de la configuración común.
2. [ ] Asegurar que una app individual inicie con su inquilino configurado y no permita cambiar de tienda ni descubrir credenciales en otras tiendas.
3. [ ] Revisar la sesión, el carrito, la lista de deseos y las notificaciones para que usen siempre el contexto correcto y manejen adecuadamente una sesión expirada o una conexión fallida.
4. [ ] Incorporar el nombre, icono, identificador Android único y versión de cada tienda a la configuración de compilación. Confirmar la estrategia de Firebase y notificaciones para cada identificador de paquete.
5. [ ] Probar los modos con y sin conexión, actualización de apariencia, tenant desconocido y compatibilidad con una tienda recién creada.
6. [ ] Ejecutar TypeScript y las pruebas móviles; añadir pruebas de comportamiento donde protejan los casos de aislamiento y configuración.

**Criterio de cierre:** una app configurada para una tienda funciona con sus datos e identidad y no depende de una lista fija de las tres tiendas existentes.

## Fase 4. APK piloto y pruebas en teléfono

**Estado: pendiente de completar y aplazada hasta el final por indicación del usuario.**

1. [ ] Elegir una tienda piloto y comprobar que su API HTTPS, nombre, logo y configuración estén disponibles desde el teléfono.
2. [ ] Generar un APK piloto con el generador manual y una clave de prueba. Verificar que termine, que la firma sea válida y que el paquete y la versión sean los esperados.
3. [ ] Confirmar con `adb devices -l` que el teléfono está autorizado y revisar si el paquete ya está instalado antes de instalar la versión de prueba.
4. [ ] Instalar y abrir la app. Comprobar que no se cierre, que presente la tienda correcta y que cargue su apariencia y catálogo desde la API esperada.
5. [ ] Probar navegación, sesión, catálogo, carrito y demás funciones acordadas con cuentas y datos de prueba. Probar compras únicamente en un entorno y con un medio de pago de prueba.
6. [ ] Verificar aislamiento entre tiendas, fallos de red, notificaciones si están configuradas y funcionamiento en Android compatible.
7. [ ] Generar una segunda versión con la misma clave de prueba y comprobar su instalación como actualización. Registrar resultados y fallos.

**Criterio de cierre:** APK piloto instalado y probado en un teléfono real, con resultados registrados. La clave temporal no se usará para distribuir aplicaciones definitivas.

## Fase 5. Automatizar la generación

**Estado: pendiente.** El script manual es un punto de partida, no una cola de producción.

1. [ ] Crear un servicio que acepte una solicitud autorizada y registre un trabajo persistente para el inquilino de la sesión.
2. [ ] Implementar una cola y un trabajador de compilación separado del servidor web, con entornos aislados, límites de recursos, tiempos máximos y control de concurrencia.
3. [ ] Generar en el trabajador la configuración de tienda, recursos de icono, nombre, paquete y versión a partir de datos validados y de una versión identificable del código móvil.
4. [ ] Definir y poner en funcionamiento la provisión de Firebase por identificador Android, o una alternativa acordada para las notificaciones. El generador actual requiere un `google-services.json` compatible con el paquete.
5. [ ] Diseñar el almacenamiento y uso seguro de claves de firma estables por aplicación, con control de acceso, respaldo y recuperación. Nunca enviar las claves al navegador ni incluirlas en el APK.
6. [ ] Firmar y verificar el APK, guardarlo en almacenamiento persistente y generar enlaces de descarga apropiados. Registrar estados y errores útiles sin guardar secretos.
7. [ ] Probar trabajos simultáneos, errores, reintentos, reinicios, límites y aislamiento de artefactos y credenciales entre inquilinos.

**Criterio de cierre:** un trabajo autorizado produce un APK firmado y verificable para la tienda correcta sin intervención manual, con errores recuperables y trazabilidad.

## Fase 6. Panel del inquilino y validación final

**Estado: pendiente.**

1. [ ] Crear la sección «Mi aplicación móvil» en el panel del inquilino y restringirla al permiso correspondiente.
2. [ ] Mostrar una vista previa de nombre, logo y colores, e indicar qué cambios necesitan una nueva versión instalada.
3. [ ] Permitir solicitar una compilación y mostrar estados claros: pendiente, compilando, disponible o error.
4. [ ] Ofrecer descarga y enlace para compartir el APK, con acceso y vigencia definidos. Mostrar el historial de versiones disponibles.
5. [ ] Probar el recorrido completo con al menos dos tiendas, incluyendo generación concurrente, descarga, instalación, actualización y revisión de que cada una acceda solo a sus datos.
6. [ ] Documentar operación, costos y requisitos de infraestructura, gestión de claves, soporte, recuperación y proceso de actualización de la app.
7. [ ] Ejecutar las suites de backend, web y móvil; realizar las pruebas en dispositivo y registrar sus resultados antes de habilitar la función.

**Criterio de cierre:** cada administrador autorizado puede generar y compartir una app funcional de su propia tienda desde el panel.

## Próximo paso recomendado

Continuar la configuración: cerrar el inventario de apariencia de la fase 1, preparar un entorno PostgreSQL aislado para probar la migración y avanzar en la automatización y el panel. Dejar la compilación e instalación del APK para el final, cuando la configuración esté lista.
