# Especificación Detallada de Casos de Uso — FashionStore SaaS (Parcial 2)

> **Sistema:** FashionStore SaaS Multi-Tenant  
> **Estándar Metodológico:** ICONIX / UML 2.5 OMG  
> **Alcance:** Arquitectura Multi-Tenant, Seguridad, Business Intelligence & Progressive Web App (PWA)  
> **Total Casos de Uso:** 18 Casos de Uso Nucleares

---

## Índice Oficial de Casos de Uso — Parcial 2

```
FASHIONSTORE SAAS — CATÁLOGO OFICIAL PARCIAL 2
├── Módulo 0: SaaS y Multi-Tenant
│   ├── CU01 - Gestionar Sistema SaaS
│   ├── CU02 - Gestionar Planes de Suscripción
│   ├── CU03 - Aprovisionar Tenant
│   ├── CU04 - Gestionar Dashboard de Super Admin
│   ├── CU05 - Gestionar Monitoreo de Tenant
│   ├── CU06 - Registrar Datos de Empresa
│   ├── CU07 - Registrar Datos de Cliente
│   ├── CU08 - Gestionar Usuario Admin Tenant
│   └── CU09 - Gestionar Módulos y Funciones
├── Módulo 1: Usuarios y Seguridad
│   ├── CU10 - Gestionar Empresas
│   ├── CU11 - Personalizar Apariencia
│   └── CU12 - Gestionar Backup y Restore
├── Módulo 7: Inteligencia de Negocios y Reportes
│   ├── CU13 - Consultar Dashboard
│   ├── CU14 - Gestionar Reportes QBE
│   └── CU15 - Gestionar Reportes por Voz
└── Módulo 8: Aplicación Web Progresiva
    ├── CU16 - Gestionar Sistema Offline
    ├── CU17 - Gestionar Datos Offline
    └── CU18 - Sincronizar Datos Offline a Online
```

---

# MÓDULO 0 — SaaS y Multi-Tenant

## Caso de Uso: CU01 — Gestionar Sistema SaaS

| Caso de Uso: CU01 - Gestionar Sistema SaaS | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Superadministrador configurar y parametrizar las directivas globales de la plataforma SaaS (políticas de aislamiento físico multi-tenant, límites de infraestructura, cuotas globales de almacenamiento en Azure, pasarelas de pago para cobro de suscripciones y configuración general del ecosistema). |
| **Actores** | Superadministrador. |
| **Iniciador** | Superadministrador. |
| **Precondiciones** | • El Superadministrador debe haber iniciado sesión con credenciales maestras de la plataforma.<br>• El servicio backend SaaS central debe estar activo y en línea.<br>• El usuario debe poseer rol de Superadministrador en la base de datos central. |
| **Flujo Principal** | 1. El Superadministrador ingresa al módulo **Configuración General SaaS** desde el panel maestro.<br>2. El sistema recupera los parámetros globales de la plataforma: modo de aislamiento (base de datos física por tenant), límites de creación de inquilinos, credenciales de Azure Storage y pasarela de cobro Stripe SaaS.<br>3. El sistema muestra la interfaz de gestión con los valores parametrizados actualmente.<br>4. El Superadministrador ajusta las configuraciones deseadas (activar/desactivar auto-registro de empresas, modificar días de prueba gratis, actualizar llaves API o reglas de aislamiento).<br>5. El Superadministrador hace clic en **Guardar Configuración SaaS**.<br>6. El sistema valida la integridad sintáctica y de conectividad de los parámetros ingresados.<br>7. El sistema persiste la configuración en la base de datos central y actualiza el contexto de ejecución en memoria.<br>8. El sistema emite un mensaje de confirmación de éxito.<br>9. El sistema registra la modificación en la bitácora global de auditoría con fecha, hora, IP y usuario responsable. |
| **Postcondiciones** | • Las directivas globales de la plataforma SaaS quedan vigentes de inmediato para el aprovisionamiento y cobro de nuevos inquilinos.<br>• La operación queda registrada de manera inmutable en la bitácora central. |
| **Excepciones** | • Llaves de API de pasarela o almacenamiento inválidas o no verificables.<br>• El usuario no cuenta con privilegios de Superadministrador (error 403 Prohibido). |

---

## Caso de Uso: CU02 — Gestionar Planes de Suscripción

| Caso de Uso: CU02 - Gestionar Planes de Suscripción | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Superadministrador definir, actualizar y dar de baja los planes comerciales de suscripción para las empresas (planes Básico, Profesional, Enterprise), estableciendo precios mensuales y anuales, límites de productos, sucursales permitidas, cuota de almacenamiento y módulos habilitados. |
| **Actores** | Superadministrador. |
| **Iniciador** | Superadministrador. |
| **Precondiciones** | • El Superadministrador debe haber iniciado sesión con permisos de gestión de suscripciones.<br>• El catálogo de módulos y funciones del sistema debe estar cargado en la base de datos. |
| **Flujo Principal** | 1. El Superadministrador ingresa a la sección **Planes de Suscripción**.<br>2. El sistema consulta y despliega los planes vigentes con sus características (nombre, precio en BOB/USD, número de productos permitidos, sucursales máximas, módulos incluidos y estado activo/inactivo).<br>3. El Superadministrador puede seleccionar un plan existente para editarlo o pulsar **Crear Nuevo Plan**.<br>4. El sistema presenta el formulario de configuración del plan.<br>5. El Superadministrador ingresa o modifica el nombre comercial, descripción, precio mensual, precio anual con descuento, límites operativos (ej. 100 productos para Básico, ilimitado para Enterprise) y selecciona los módulos del sistema incluidos en el plan.<br>6. El Superadministrador presiona **Guardar Plan**.<br>7. El sistema valida que los precios sean valores positivos y que al menos un módulo básico esté seleccionado.<br>8. El sistema guarda o actualiza el registro del plan en la base de datos central y sincroniza el identificador de producto/precio en Stripe si aplica cobro automatizado.<br>9. El sistema confirma la operación y actualiza la lista visible.<br>10. La acción queda registrada en la bitácora con los datos previos y nuevos. |
| **Postcondiciones** | • El plan de suscripción queda disponible en la landing page del SaaS para nuevas contrataciones.<br>• Las empresas ya suscritas mantienen sus condiciones contractuales vigentes. |
| **Excepciones** | • Intento de eliminar un plan que posee tenants actualmente activos con suscripción vigente (el sistema impide la eliminación y sugiere archivarlo/desactivarlo).<br>• Datos numéricos inconsistentes (precios negativos o límites inferiores a cero). |

---

## Caso de Uso: CU03 — Aprovisionar Tenant

| Caso de Uso: CU03 - Aprovisionar Tenant | Descripción |
| :--- | :--- |
| **Propósito** | Ejecutar de forma automatizada y desatendida el aprovisionamiento técnico de un nuevo inquilino al registrarse una empresa: creación de su base de datos física dedicada en Azure PostgreSQL (`nombreempresa_db`), ejecución de la plantilla DDL completa (44 tablas, módulos y funciones base), generación del usuario administrador inicial y configuración de su esquema de apariencia. |
| **Actores** | Sistema (Proceso desatendido), Superadministrador. |
| **Iniciador** | Sistema (Disparado al confirmarse el registro de empresa o pago de suscripción) / Superadministrador (Aprovisionamiento manual). |
| **Precondiciones** | • El registro de la empresa debe estar validado con su slug identificador único.<br>• El servidor Azure PostgreSQL debe tener permisos y capacidad para crear bases de datos (`CREATE DATABASE`).<br>• El archivo de plantilla `EsquemaEcommerce.sql` debe estar disponible en el backend. |
| **Flujo Principal** | 1. El sistema inicia el proceso de aprovisionamiento al recibir los datos validados de la nueva empresa y su administrador.<br>2. El sistema genera el nombre normalizado de la base de datos dedicada (ej. `urbanly_db`, `aura_sport_db`).<br>3. El sistema se conecta a la instancia de PostgreSQL y ejecuta la sentencia `CREATE DATABASE <tenant_db>`.<br>4. El sistema establece conexión con la base de datos recién creada y ejecuta el script DDL estructural `EsquemaEcommerce.sql`, creando las 44 tablas, llaves foráneas, índices, módulos y funciones del sistema.<br>5. El sistema hashea la contraseña del administrador del tenant con algoritmo `bcrypt` (10 rondas de salt).<br>6. El sistema inserta el registro del usuario administrador en la tabla `USUARIO` asignándole el rol Administrador (`ID_ROL = 1`).<br>7. El sistema crea el perfil de empleado correspondiente en la tabla `EMPLEADO` (`EMP-ADM-001`) y asocia su cuenta de usuario.<br>8. El sistema inicializa la configuración de identidad visual en `tenants_appearance.json` y la tabla `CONFIGURACION_EMPRESA`.<br>9. El sistema registra el nuevo tenant en el catálogo maestro y añade su pool de conexión dinámica en `PrismaService`.<br>10. El sistema emite la confirmación de aprovisionamiento exitoso y envía correo de bienvenida con credenciales al administrador.<br>11. Se registra la creación del tenant en la bitácora central con tiempo de ejecución y estado final. |
| **Postcondiciones** | • El nuevo tenant cuenta con su base de datos física completamente aislada y operativa.<br>• El administrador del tenant puede iniciar sesión de inmediato en su ruta dedicada `/store/:tenant/login`.<br>• La tienda pública del inquilino queda lista para personalización y carga de catálogo. |
| **Excepciones** | • El slug de la empresa ya existe en el servidor PostgreSQL (nombre de base de datos duplicado).<br>• Error de sintaxis o fallo de ejecución en el script DDL `EsquemaEcommerce.sql` (el sistema ejecuta rollback y elimina la base de datos incompleta).<br>• Tiempo de espera excedido en el servidor de base de datos durante la creación. |

---

## Caso de Uso: CU04 — Gestionar Dashboard de Super Admin

| Caso de Uso: CU04 - Gestionar Dashboard de Super Admin | Descripción |
| :--- | :--- |
| **Propósito** | Proporcionar al Superadministrador del sistema SaaS una interfaz analítica global y unificada para visualizar en tiempo real los principales indicadores del ecosistema multi-tenant: número total de inquilinos activos, suspendidos y en período de prueba, ingresos recurrentes mensuales (MRR), distribución geográfica de empresas, volumen transaccional diario y métricas de consumo de infraestructura. |
| **Actores** | Superadministrador. |
| **Iniciador** | Superadministrador. |
| **Precondiciones** | • El Superadministrador debe haber iniciado sesión con credenciales maestras de nivel SaaS.<br>• El servicio backend de administración central debe estar operativo.<br>• Las conexiones a los esquemas de telemetría y suscripciones deben estar disponibles. |
| **Flujo Principal** | 1. El Superadministrador accede al panel administrativo central seleccionando **Dashboard SaaS**.<br>2. El sistema consulta las métricas consolidadas de todas las empresas y planes de suscripción.<br>3. El sistema procesa y renderiza los widgets ejecutivos: Tenants totales por estado (Activo/Inactivo/Demo), Ingresos Recurrentes (MRR/ARR), Nuevas Empresas registradas en el mes y Tasa de Retención/Churn.<br>4. El sistema presenta gráficos interactivos de evolución temporal de ingresos y crecimiento de inquilinos.<br>5. El Superadministrador puede filtrar el tablero por rango de fechas, plan de suscripción (Básico, Profesional, Enterprise) o país/región.<br>6. El sistema actualiza dinámicamente los gráficos y contadores sin recargar la página completa.<br>7. El Superadministrador puede hacer clic en un indicador o empresa para navegar al detalle específico del inquilino.<br>8. El sistema registra el acceso al dashboard en la bitácora de auditoría global de la plataforma SaaS. |
| **Postcondiciones** | • El Superadministrador obtiene visibilidad integral y en tiempo real del estado de la plataforma.<br>• No se alteran los datos operativos de los inquilinos.<br>• La consulta queda registrada en la bitácora central de auditoría. |
| **Excepciones** | • Fallo de conectividad con la base de datos central o timeout al procesar métricas de facturación.<br>• El usuario no cuenta con privilegios de rol Superadministrador (acceso denegado 403). |

---

## Caso de Uso: CU05 — Gestionar Monitoreo de Tenant

| Caso de Uso: CU05 - Gestionar Monitoreo de Tenant | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Superadministrador y a los administradores de plataforma supervisar en tiempo real la salud operativa, rendimiento técnico y consumo de recursos de cada tenant (estado del pool de conexiones PostgreSQL, latencia de respuesta HTTP, almacenamiento consumido en Azure Blob Storage, cuota de base de datos y tasa de errores 4xx/5xx), con capacidad de alertar y pausar inquilinos anómalos. |
| **Actores** | Superadministrador, Ingeniero de Operaciones / DevOps. |
| **Iniciador** | Superadministrador. |
| **Precondiciones** | • El usuario debe autenticarse con perfil de Superadministrador o soporte técnico nivel 3.<br>• Los agentes de telemetría y métricas de Azure App Service y PostgreSQL deben estar recolectando datos operativos. |
| **Flujo Principal** | 1. El Superadministrador ingresa al módulo **Monitoreo de Tenants** dentro del panel SaaS.<br>2. El sistema lista todos los inquilinos registrados mostrando su indicador de estado en tiempo real (Healthy / Warning / Critical / Down).<br>3. El Superadministrador selecciona un tenant específico (ej. Dressly, Urbanly, Aura Sport o nuevo tenant) para auditar su salud.<br>4. El sistema consulta la telemetría en vivo: conexiones activas en su base de datos física dedicada (`dressly_db`, `urbanly_db`), consumo de almacenamiento en Azure Blob Storage, tiempo medio de respuesta y uso de memoria.<br>5. El sistema despliega gráficos de telemetría con umbrales configurables (consumo de CPU, memoria, tasa de peticiones por minuto).<br>6. Si un tenant supera el 90% de su cuota contratada o presenta picos de error anómalos, el sistema marca una alerta visual destacada.<br>7. El Superadministrador puede ejecutar acciones operativas: purgar caché, reiniciar pool de conexiones del tenant, o suspender temporalmente el acceso del inquilino por mantenimiento o sobreconsumo.<br>8. El sistema ejecuta la acción correctiva seleccionada y emite el informe de resultado.<br>9. El sistema registra cada acción de supervisión e intervención en la bitácora de auditoría con timestamp y operador responsable. |
| **Postcondiciones** | • Se mantiene la estabilidad y aislamiento del ecosistema evitando que un tenant afecte a los demás (*Noisy Neighbor*).<br>• Los umbrales y estados de supervisión se registran para análisis histórico de SLA.<br>• Las acciones correctivas quedan asentadas con trazabilidad total. |
| **Excepciones** | • Inaccesibilidad a las APIs de métricas de Azure Monitor o Application Insights.<br>• El tenant seleccionado se encuentra en proceso de aprovisionamiento o migración de base de datos. |

---

## Caso de Uso: CU06 — Registrar Datos de Empresa

| Caso de Uso: CU06 - Registrar Datos de Empresa | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al representante de una nueva empresa registrar la información jurídica, comercial y de contacto de su negocio durante el proceso de onboarding en la landing page del SaaS, estableciendo su subdominio o slug de acceso para la tienda virtual. |
| **Actores** | Representante de Empresa / Nuevo Cliente SaaS. |
| **Iniciador** | Representante de Empresa. |
| **Precondiciones** | • El usuario debe acceder a la landing page pública del SaaS (`/`).<br>• Debe haber seleccionado un plan de suscripción o iniciado el registro de prueba. |
| **Flujo Principal** | 1. El representante hace clic en **Registrar mi Empresa** o **Comenzar Prueba Gratis** desde la landing page.<br>2. El sistema despliega el paso 1 del asistente de onboarding: Datos de la Empresa.<br>3. El representante ingresa la Razón Social, Nombre Comercial, NIT o identificación tributaria, país, moneda comercial (BOB / USD) y el subdominio/slug deseado (ej. `urbanly`, `dressly`).<br>4. El sistema valida en tiempo real la disponibilidad del slug para asegurar que sea único y no contenga caracteres inválidos.<br>5. El representante introduce los datos de contacto corporativo: teléfono, correo electrónico empresarial y dirección física.<br>6. El usuario pulsa **Siguiente: Datos de Cuenta**.<br>7. El sistema valida los campos obligatorios y almacena temporalmente los datos en el contexto de registro.<br>8. El sistema pasa al siguiente paso del flujo de alta (CU07 / CU08). |
| **Postcondiciones** | • Los datos preliminares de la empresa quedan verificados y listos para la creación del tenant.<br>• El slug queda temporalmente reservado durante la sesión de onboarding. |
| **Excepciones** | • El slug solicitado ya está en uso por otra empresa en la plataforma.<br>• Formato de NIT o correo empresarial inválido.<br>• Campos obligatorios sin completar. |

---

## Caso de Uso: CU07 — Registrar Datos de Cliente

| Caso de Uso: CU07 - Registrar Datos de Cliente | Descripción |
| :--- | :--- |
| **Propósito** | Capturar y validar los datos de facturación, método de pago y contacto del suscriptor responsable de la cuenta SaaS para la emisión de facturas periódicas de suscripción y formalización contractual del servicio en la nube. |
| **Actores** | Representante de Empresa / Suscriptor SaaS. |
| **Iniciador** | Representante de Empresa. |
| **Precondiciones** | • Haber completado el paso previo de datos de empresa (CU06). |
| **Flujo Principal** | 1. El sistema presenta el paso de facturación y cliente suscriptor dentro del flujo de registro.<br>2. El suscriptor ingresa el nombre del titular o razón de facturación, documento de identidad/NIT, dirección de facturación y teléfono de contacto administrativo.<br>3. El suscriptor selecciona el método de pago para el plan (Tarjeta de Crédito/Débito vía Stripe, Transferencia o período de prueba sin tarjeta).<br>4. En caso de pago digital, el sistema invoca la pasarela segura de Stripe Checkout y procesa la verificación del método de pago.<br>5. El suscriptor acepta los Términos y Condiciones y la Política de Privacidad del SaaS.<br>6. El sistema valida la aprobación de la transacción o activación del período de prueba.<br>7. El sistema asocia los datos de facturación al registro del cliente suscriptor en la base central.<br>8. El sistema avanza automáticamente al paso final de creación de credenciales administrativas (CU08). |
| **Postcondiciones** | • El cliente queda registrado en el módulo de facturación del SaaS con su ID de cliente de pasarela.<br>• Se emite el primer comprobante o recibo de suscripción electrónica. |
| **Excepciones** | • Tarjeta rechazada por la entidad bancaria o fondos insuficientes.<br>• El usuario no acepta los términos y condiciones del servicio. |

---

## Caso de Uso: CU08 — Gestionar Usuario Admin Tenant

| Caso de Uso: CU08 - Gestionar Usuario Admin Tenant | Descripción |
| :--- | :--- |
| **Propósito** | Permitir la creación, asignación de credenciales maestras y gestión del usuario Administrador principal del tenant, quien tendrá el control total inicial sobre la configuración de la tienda, catálogo, empleados y roles dentro de su empresa. |
| **Actores** | Representante de Empresa (al registrarse), Superadministrador (en soporte/gestión). |
| **Iniciador** | Representante de Empresa / Superadministrador. |
| **Precondiciones** | • Datos de empresa y suscripción completados con éxito (CU06 y CU07).<br>• El tenant debe estar en proceso de aprovisionamiento o ya activo. |
| **Flujo Principal** | 1. El sistema solicita al representante definir las credenciales de la cuenta Administrador de su empresa: Nombre completo, correo electrónico administrativo y contraseña.<br>2. El usuario introduce el correo (ej. `admin@urbanly.bo`) y contraseña robusta (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo).<br>3. El sistema valida en tiempo real la robustez de la contraseña y confirma que el correo sea válido.<br>4. El usuario confirma la contraseña y pulsa **Crear Empresa y Finalizar Registro**.<br>5. El sistema dispara el aprovisionamiento técnico del tenant (CU03), encripta la contraseña con `bcrypt` y crea el usuario con `ID_ROL = 1` (Administrador).<br>6. El sistema crea su ficha de empleado inicial (`EMP-ADM-001`) vinculada a su cuenta.<br>7. El sistema envía un correo de confirmación de cuenta con las credenciales y el enlace de acceso directo al panel administrativo del tenant (`/store/:tenant/login`).<br>8. El sistema redirige al usuario a su pantalla de bienvenida o login con sus datos listos para operar.<br>9. Posteriormente, el Administrador puede ingresar a su perfil para actualizar su contraseña o datos personales. |
| **Postcondiciones** | • El usuario administrador del tenant queda creado con privilegios totales sobre su base de datos aislada.<br>• La cuenta queda lista para autenticarse de inmediato en su tienda. |
| **Excepciones** | • La contraseña no cumple con los requisitos mínimos de complejidad de seguridad.<br>• El correo administrativo ya está asignado a otro usuario dentro del mismo tenant. |

---

## Caso de Uso: CU09 — Gestionar Módulos y Funciones

| Caso de Uso: CU09 - Gestionar Módulos y Funciones | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Superadministrador habilitar, restringir o asignar dinámicamente los módulos del sistema (Catálogo, Sucursales, Reservas, POS, Probador Virtual, Dashboard BI, Reportes Voz/QBE y PWA Offline) a cada empresa según el plan contratado o add-ons adquiridos, garantizando el cumplimiento contractual. |
| **Actores** | Superadministrador. |
| **Iniciador** | Superadministrador. |
| **Precondiciones** | • El Superadministrador debe haber iniciado sesión con permisos sobre la plataforma SaaS.<br>• El tenant debe existir en la base de datos central. |
| **Flujo Principal** | 1. El Superadministrador accede al módulo **Gestión de Módulos y Tenants**.<br>2. El sistema lista todos los módulos y funciones del sistema clasificados por categoría.<br>3. El Superadministrador selecciona una empresa específica para auditar sus módulos autorizados.<br>4. El sistema despliega el árbol de funciones y submódulos indicando cuáles están activos y cuáles deshabilitados para el tenant según su plan.<br>5. El Superadministrador activa o desactiva módulos mediante switches visuales (ej. habilitar *Reportes por Voz con IA* o *Punto de Venta POS*).<br>6. El Superadministrador pulsa **Guardar Asignación de Módulos**.<br>7. El sistema actualiza los registros de permisos y suscripción en la base de datos del tenant y catálogo central.<br>8. El sistema invalida la caché de permisos del tenant para que la interfaz web del inquilino oculte o muestre inmediatamente los menús correspondientes.<br>9. El sistema confirma la actualización y registra la operación en la bitácora central con los módulos modificados. |
| **Postcondiciones** | • Los usuarios del tenant solo podrán visualizar y acceder a las rutas y APIs de los módulos contratados y activos.<br>• El control de acceso RBAC del tenant refleja los módulos permitidos. |
| **Excepciones** | • Intento de deshabilitar el módulo nuclear de Seguridad o Catálogo básico (el sistema advierte que son dependencias críticas).<br>• Fallo de conectividad con la base de datos del tenant. |

---

# MÓDULO 1 — Usuarios y Seguridad

## Caso de Uso: CU10 — Gestionar Empresas

| Caso de Uso: CU10 - Gestionar Empresas | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador (o Superadministrador) registrar, consultar y actualizar la información corporativa, legal y de contacto del inquilino SaaS (Razón Social, Nombre Comercial, NIT, País, Moneda principal/secundaria, logo, dirección fiscal y correo oficial), asegurando la correcta parametrización de su identidad empresarial en la plataforma. |
| **Actores** | Administrador, Superadministrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión con credenciales válidas en su tenant.<br>• Debe contar con el permiso asignado para gestionar empresas (CU10).<br>• El inquilino SaaS debe encontrarse en estado ACTIVO en la base de datos central. |
| **Flujo Principal** | 1. El Administrador ingresa al módulo **Configuración de Empresa** desde el menú administrativo.<br>2. El sistema consulta y recupera los datos corporativos actuales registrados en el esquema (Razón Social, Nombre Comercial, NIT, País, Monedas y datos de contacto).<br>3. El sistema presenta el formulario de configuración empresarial con la información precargada.<br>4. El Administrador revisa los datos y modifica los campos requeridos (Nombre comercial, teléfono, dirección fiscal, email corporativo o monedas operativas).<br>5. Opcionalmente, el Administrador selecciona y sube un nuevo archivo de logotipo corporativo (JPG/PNG).<br>6. El Administrador pulsa el botón **Guardar Cambios**.<br>7. El sistema valida el formato de NIT, estructura del correo electrónico, longitud de campos y tamaño/formato del archivo de logotipo.<br>8. El sistema actualiza el registro en la base de datos y almacena el logo en Azure Blob Storage (`fashionstorestorages`) si fue modificado.<br>9. El sistema emite un mensaje de confirmación de éxito.<br>10. El sistema registra la operación en la bitácora de auditoría con fecha, hora, dirección IP y usuario responsable. |
| **Postcondiciones** | • Los datos corporativos de la empresa quedan actualizados y vigentes para facturación y cabeceras de tienda.<br>• El nuevo logotipo e información se reflejan de inmediato en la vitrina digital del tenant.<br>• La acción queda registrada de manera inmutable en la bitácora. |
| **Excepciones** | • El NIT ingresado no cumple con el formato tributario legal o ya se encuentra registrado por otra empresa.<br>• El archivo de logotipo excede el tamaño máximo permitido (2 MB) o formato no soportado.<br>• El correo corporativo ingresado posee un formato sintáctico inválido.<br>• El Administrador no cuenta con permisos de escritura sobre la configuración empresarial. |

---

## Caso de Uso: CU11 — Personalizar Apariencia

| Caso de Uso: CU11 - Personalizar Apariencia | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador personalizar la identidad visual completa de la tienda online del tenant (paleta de colores primario, secundario y acento, color de fondo general de la página y tarjetas, tipografías, banners promocionales y modo de visualización con selector libre de color y presets), logrando que la vitrina digital refleje la personalidad de su marca en tiempo real sin requerir código. |
| **Actores** | Administrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión en el panel administrativo.<br>• Debe contar con el permiso para personalizar la apariencia de la tienda (CU11).<br>• Debe existir un catálogo de productos activo en el tenant para previsualizar los cambios. |
| **Flujo Principal** | 1. El Administrador ingresa al módulo **Personalizar Apariencia**.<br>2. El sistema carga la configuración visual vigente (color primario, secundario, acento, fondo de página, fondo de tarjetas, tipografía seleccionada y banners actuales).<br>3. El sistema muestra la interfaz de personalización con un visor de previsualización interactiva en tiempo real (*Live Preview*) y selector libre de color (*Color Picker* / Hexadecimal).<br>4. El Administrador selecciona o ajusta los códigos cromáticos hexadecimales para los fondos de tienda (ej. fondos claros neutros, o presets oscuros "Rojo y Negro / Crimson & Noir").<br>5. El sistema calcula dinámicamente el contraste cromático de los textos para garantizar legibilidad inmediata según la luminosidad del color seleccionado.<br>6. El Administrador elige la familia tipográfica para títulos y texto entre las opciones admitidas por la plataforma.<br>7. El Administrador carga o actualiza los banners de la portada principal (Hero Banner y banners de temporada).<br>8. El sistema actualiza la previsualización en vivo mostrando instantáneamente cómo lucirá la tienda en versiones escritorio y móvil.<br>9. El Administrador presiona **Aplicar y Publicar Tema**.<br>10. El sistema valida los formatos de color y dimensiones de las imágenes de banner.<br>11. El sistema persiste la configuración en `tenants_appearance.json` y en la base de datos del tenant, inyectando las variables CSS `--storefront-page-bg`, `--color-primary`, etc.<br>12. El sistema muestra un mensaje de éxito y registra el cambio en la bitácora con los valores previos y nuevos. |
| **Postcondiciones** | • La tienda pública del tenant adopta inmediatamente los nuevos colores, fondos, tipografías y banners.<br>• Las preferencias visuales se persisten para todas las sesiones de clientes visitantes.<br>• La modificación queda registrada en la bitácora con trazabilidad de cambios. |
| **Excepciones** | • Los códigos de color ingresados no cumplen con el formato hexadecimal válido (`#RRGGBB`).<br>• La imagen de banner no cumple con las dimensiones recomendadas (1600x900) o excede el límite de peso.<br>• Falla de conectividad con el almacenamiento en la nube Azure Blob al subir los banners.<br>• El Administrador carece de permisos para modificar el diseño visual. |

---

## Caso de Uso: CU12 — Gestionar Backup y Restore

| Caso de Uso: CU12 - Gestionar Backup y Restore | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador generar respaldos completos bajo demanda de la base de datos de su tenant, descargar copias de seguridad en formato comprimido (.sql.gz / .json), consultar el historial de backups y solicitar o ejecutar restauraciones a un punto de recuperación previo de forma segura e íntegra con persistencia en Azure Blob Storage. |
| **Actores** | Administrador, Superadministrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión con credenciales de nivel administrativo.<br>• Debe contar con el permiso de gestión de backups y restore (CU12).<br>• El servicio de almacenamiento Azure Blob Storage (`fashionstorestorages`) debe encontrarse en línea y disponible. |
| **Flujo Principal** | 1. El Administrador ingresa a la sección **Backups y Restauración** dentro de Usuarios y Seguridad.<br>2. El sistema consulta y lista el historial de copias de seguridad existentes (fecha, hora, tamaño, checksum SHA-256, tipo y estado en Azure Blob).<br>3. El Administrador selecciona la acción **Generar Backup Bajo Demanda**.<br>4. El sistema solicita confirmación y una etiqueta descriptiva opcional para el respaldo.<br>5. El Administrador confirma la operación.<br>6. El sistema ejecuta el volcado lógico exclusivo de las tablas y registros del tenant, genera el payload estructurado y calcula su hash criptográfico SHA-256.<br>7. El sistema sube el archivo empaquetado al contenedor privado de Azure Blob Storage (`backups`).<br>8. El sistema registra el respaldo en el catálogo manifiesto histórico con su URL segura, tamaño, fecha y checksum.<br>9. El sistema notifica al Administrador que el respaldo se generó con éxito y habilita su descarga o restauración.<br>10. Opcionalmente, para restaurar, el Administrador selecciona un backup del historial y pulsa **Restaurar Esquema**.<br>11. El sistema solicita reautenticación de seguridad (ingreso de contraseña de Administrador) para confirmar la restauración.<br>12. El sistema restaura las entidades del tenant al estado exacto de dicho respaldo de forma atómica y transaccional.<br>13. El sistema registra la operación de backup o restore en la bitácora con trazabilidad inmutable. |
| **Postcondiciones** | • Se genera una copia de seguridad íntegra y verificada en Azure Blob Storage.<br>• En caso de restore, los datos del tenant vuelven al estado exacto de la fecha seleccionada sin afectar a otros inquilinos.<br>• La acción queda registrada en el historial de backups/restauraciones y en la bitácora de auditoría. |
| **Excepciones** | • Espacio insuficiente en el almacenamiento de blobs o cuota del plan excedida.<br>• Fallo en la autenticación con la contraseña maestra al intentar una restauración.<br>• El archivo de backup presenta discrepancia en el checksum SHA-256 (archivo corrupto o alterado).<br>• Pérdida de conexión con el motor de base de datos durante el volcado o restauración. |

---

# MÓDULO 7 — Inteligencia de Negocios y Reportes

## Caso de Uso: CU13 — Consultar Dashboard

| Caso de Uso: CU13 - Consultar Dashboard | Descripción |
| :--- | :--- |
| **Propósito** | Proveer al Administrador del tenant y al Gerente Comercial un panel ejecutivo interactivo estilo Power BI con KPIs comerciales clave (ventas netas, margen de contribución, ticket promedio, rotación de inventario y tasa de conversión), enriquecido con modelos predictivos de Machine Learning para pronóstico de demanda a 4 semanas y segmentación RFM con K-Means. |
| **Actores** | Administrador de Tenant, Gerente Comercial. |
| **Iniciador** | Administrador de Tenant. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión con permisos para CU13 en su tenant.<br>• La base de datos del tenant debe poseer registros históricos de ventas e inventario. |
| **Flujo Principal** | 1. El usuario accede al menú **Inteligencia de Negocios > Dashboard**.<br>2. El sistema recupera de la base de datos del tenant los datos transaccionales, reservas y existencias de sucursales.<br>3. El sistema calcula y muestra las tarjetas de KPIs ejecutivos: Ingresos Totales, Ganancia Estimada, Ticket Promedio y Cantidad de Transacciones, comparadas con el período anterior.<br>4. El sistema ejecuta el algoritmo predictivo de regresión (*Machine Learning* supervisado) sobre las series temporales para proyectar la curva estimada de ventas de las siguientes 4 semanas.<br>5. El sistema procesa la matriz RFM (Recencia, Frecuencia, Valor Monetario) aplicando K-Means (*Machine Learning* no supervisado) para clasificar a los clientes en cuadrantes: Clientes VIP, Clientes Frecuentes, Ocasionales y En Riesgo.<br>6. El sistema renderiza gráficos de barras por categoría más vendida, mapa de calor de ventas por sucursal física y embudo de conversión tienda/online.<br>7. El usuario puede aplicar filtros dinámicos por rango de fechas (Semana, Mes, Trimestre, Año), sucursal específica o canal de venta (POS presencial vs. Ecommerce).<br>8. El sistema recalcula y refresca inmediatamente todas las visualizaciones y proyecciones.<br>9. El usuario puede exportar una instantánea del tablero en PDF de alta calidad.<br>10. El sistema registra la consulta analítica en la bitácora del inquilino. |
| **Postcondiciones** | • El usuario toma decisiones estratégicas de aprovisionamiento y promociones fundamentadas en datos y analítica predictiva.<br>• Los datos analíticos quedan consolidados en caché para optimizar consultas posteriores. |
| **Excepciones** | • Historial transaccional insuficiente para entrenar o calibrar los modelos de regresión y clusters RFM (el sistema muestra datos descriptivos estándar con advertencia informativa).<br>• Parámetros de fecha incoherentes (fecha final anterior a la inicial). |

---

## Caso de Uso: CU14 — Gestionar Reportes QBE

| Caso de Uso: CU14 - Gestionar Reportes QBE | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador y analistas de negocio construir y ejecutar reportes analíticos personalizados mediante una interfaz visual "Query by Example" (QBE), seleccionando entidades, columnas, condiciones lógicas, agregaciones y ordenamiento sin requerir conocimientos de SQL, con previsualización interactiva y exportación a formatos Excel (XLSX) y CSV. |
| **Actores** | Administrador de Tenant, Analista de Datos / Encargado de Sucursal. |
| **Iniciador** | Administrador de Tenant. |
| **Precondiciones** | • El usuario debe contar con credenciales válidas y permiso para generación de reportes QBE (CU14).<br>• Las vistas y tablas analíticas del esquema del tenant deben estar accesibles. |
| **Flujo Principal** | 1. El usuario ingresa a la sección **Reportes > Diseñador QBE**.<br>2. El sistema presenta el selector de Entidad Principal de análisis (Ventas, Clientes, Inventario, Productos o Reservas).<br>3. El usuario selecciona la entidad (ej.: *Ventas*) y el sistema despliega el catálogo de campos disponibles (Fecha, Cliente, Sucursal, Producto, Cantidad, Monto, Método de Pago, etc.).<br>4. El usuario marca las columnas que desea incluir en la grilla de resultados.<br>5. El usuario define criterios de filtrado agregando una o más filas de condiciones con operadores visuales (`igual a`, `diferente de`, `contiene`, `mayor o igual que`, `entre fechas`).<br>6. Opcionalmente, el usuario añade funciones de agregación (`SUM` sobre montos, `AVG` sobre tickets, `COUNT` de transacciones) y agrupamiento (`GROUP BY` por Sucursal o Categoría).<br>7. El usuario selecciona el criterio de ordenamiento (Ascendente / Descendente) y el límite de filas a consultar.<br>8. El usuario presiona el botón **Ejecutar Consulta QBE**.<br>9. El backend valida semánticamente la consulta contra el diccionario de datos del tenant (garantizando blindaje total contra inyección de código SQL).<br>10. El sistema ejecuta la consulta y despliega los resultados en una tabla interactiva paginada con ordenamiento en cliente y totales calculados.<br>11. Opcionalmente, el usuario pulsa **Exportar a Excel** o **Exportar a CSV**; el sistema genera el archivo formateado (`exceljs`) y dispara la descarga automática.<br>12. Opcionalmente, el usuario puede guardar la definición del reporte con un nombre para reutilizarla en el futuro.<br>13. El sistema registra la ejecución del reporte QBE en la bitácora de auditoría. |
| **Postcondiciones** | • El usuario obtiene el dataset personalizado adaptado a su requerimiento de información ad-hoc.<br>• Si se guardó la plantilla, queda disponible en el catálogo de reportes guardados del tenant.<br>• La ejecución del reporte queda auditada en la bitácora. |
| **Excepciones** | • El usuario no selecciona ninguna columna para la proyección.<br>• Criterio de filtrado incompatible con el tipo de dato del campo (ej. texto en campo numérico o fecha mal formateada).<br>• La consulta no arroja ningún registro concordante con los filtros establecidos. |

---

## Caso de Uso: CU15 — Gestionar Reportes por Voz

| Caso de Uso: CU15 - Gestionar Reportes por Voz | Descripción |
| :--- | :--- |
| **Propósito** | Permitir a directivos y administradores consultar métricas comerciales e inventario utilizando lenguaje natural mediante voz (Web Speech API) o texto libre, traduciendo automáticamente la intención a consultas estructuradas seguras mediante Inteligencia Artificial (LLM) y renderizando tanto los datos tabulares como la gráfica más representativa de forma instantánea. |
| **Actores** | Administrador de Tenant, Directores Comerciales. |
| **Iniciador** | Administrador de Tenant. |
| **Precondiciones** | • El usuario debe haber iniciado sesión y poseer permiso para CU15.<br>• El navegador debe contar con soporte de Web Speech API y permisos de micrófono concedidos (para entrada por voz).<br>• El servicio o motor de IA para procesamiento de lenguaje natural debe estar activo. |
| **Flujo Principal** | 1. El usuario accede al módulo **Reportes Asistidos por Voz / IA**.<br>2. El usuario hace clic en el botón de micrófono y formula su consulta verbalmente (ej.: *"¿Cuáles fueron los 5 productos con mayores ventas en la sucursal Norte durante este mes?"*), o la escribe en la caja de texto.<br>3. El sistema captura el audio, ejecuta el reconocimiento de voz en tiempo real y transcribe la consulta en la pantalla para validación visual del usuario.<br>4. El sistema envía el texto al motor de IA con el esquema semántico del tenant.<br>5. El motor de IA interpreta la intención, detecta las entidades (producto, sucursal, fechas, métrica de ventas) y genera un objeto JSON estricto con los parámetros de la consulta (sin código SQL crudo).<br>6. El backend valida el JSON contra las reglas del dominio y ejecuta la consulta de forma segura sobre la base de datos del tenant.<br>7. El sistema determina automáticamente la visualización más pertinente según el tipo de datos (ej.: gráfico de barras para ranking de productos, gráfico de líneas para evolución temporal, o tabla para listados detallados).<br>8. El sistema muestra la respuesta con una síntesis en lenguaje natural (ej.: *"Se identificaron 5 productos principales liderados por Vestido Camisero con 45 unidades vendidas"*), acompañada del gráfico interactivo y la tabla de datos.<br>9. El usuario puede refinar la consulta verbalmente (ej.: *"Ahora compáralo con el mes anterior"*).<br>10. Opcionalmente, el usuario puede escuchar la síntesis mediante voz sintetizada (*Text-to-Speech*) o exportar los datos resultantes a Excel.<br>11. La consulta y su resolución quedan registradas en la bitácora para trazabilidad y auditoría. |
| **Postcondiciones** | • El directivo obtiene respuestas inmediatas a preguntas complejas de negocio sin intermediación técnica.<br>• No se altera la integridad de la base de datos transaccional.<br>• La interacción por voz/IA queda registrada en la bitácora. |
| **Excepciones** | • El navegador no tiene acceso al micrófono o el usuario deniega el permiso.<br>• El audio es inaudible o el nivel de ruido ambiental impide la transcripción precisa.<br>• La consulta formulada es ambigua o solicita información inexistente en el modelo de datos (el sistema solicita aclaración indicando sugerencias válidas). |

---

# MÓDULO 8 — Aplicación Web Progresiva (PWA)

## Caso de Uso: CU16 — Gestionar Sistema Offline

| Caso de Uso: CU16 - Gestionar Sistema Offline | Descripción |
| :--- | :--- |
| **Propósito** | Garantizar la operatividad ininterrumpida de la aplicación web como Progressive Web App (PWA) ante caídas de red o trabajo en entornos sin conexión a internet, mediante el registro de Service Workers, gestión inteligente de caché de activos estáticos (HTML, JS, CSS, fuentes e imágenes) y detección proactiva del estado de conectividad online/offline. |
| **Actores** | Administrador, Cajero (POS), Cliente, Sistema (Service Worker). |
| **Iniciador** | Sistema / Usuario. |
| **Precondiciones** | • El usuario debe acceder a la aplicación desde un navegador compatible con estándares PWA y Service Workers (Chrome, Edge, Safari, Firefox).<br>• La aplicación debe servirse bajo protocolo seguro HTTPS (o localhost en desarrollo). |
| **Flujo Principal** | 1. El usuario accede a la plataforma web del tenant desde su dispositivo móvil o estación de trabajo.<br>2. El navegador detecta el archivo de manifiesto PWA (`manifest.json`) y registra en segundo plano el **Service Worker** de la aplicación.<br>3. El Service Worker intercepta las solicitudes de instalación y almacena en caché estática (*Pre-caching*) los recursos esenciales para la interfaz (shell de la app, componentes React/Vite, estilos e íconos).<br>4. El sistema ofrece al usuario la opción nativa de "Instalar Aplicación en Pantalla de Inicio / Escritorio".<br>5. Cuando se interrumpe la conexión a internet, el detector de conectividad (`navigator.onLine` y eventos `online`/`offline`) detecta el cambio de estado de red.<br>6. El sistema actualiza la interfaz mostrando un banner no invasivo de color ámbar: *"Modo Fuera de Línea Activado — Operando con datos locales"*.<br>7. El Service Worker activa la estrategia de caché *Cache-First* / *Stale-While-Revalidate*, sirviendo inmediatamente las pantallas, catálogos previamente visitados e interfaz del sistema sin mostrar pantallas de error de red.<br>8. El usuario continúa navegando por los catálogos y operando las funciones permitidas sin interrupción.<br>9. Al restablecerse la conectividad, el sistema detecta el evento `online`, retira el banner offline y notifica al usuario: *"Conexión restablecida — Sistema en línea"*. |
| **Postcondiciones** | • La plataforma se mantiene accesible y operativa incluso en ausencia total de conectividad a internet.<br>• El usuario experimenta tiempos de carga casi instantáneos gracias a la caché local optimizada.<br>• La transición entre estados online y offline se realiza de manera transparente. |
| **Excepciones** | • El navegador del cliente tiene deshabilitados los Service Workers o se encuentra en modo incógnito restrictivo.<br>• Capacidad de almacenamiento en disco del dispositivo insuficiente para guardar los recursos en caché. |

---

## Caso de Uso: CU17 — Gestionar Datos Offline

| Caso de Uso: CU17 - Gestionar Datos Offline | Descripción |
| :--- | :--- |
| **Propósito** | Permitir el almacenamiento, consulta y captura transaccional local de datos críticos del negocio (catálogo de productos básicos, existencias de la sucursal, clientes habituales, carritos de compra y ventas del punto de venta POS) dentro de la base de datos local del navegador (**IndexedDB**), garantizando que las operaciones comerciales puedan continuar registrándose sin conexión a internet. |
| **Actores** | Cajero (POS), Cliente, Administrador. |
| **Iniciador** | Cajero / Cliente. |
| **Precondiciones** | • El usuario debe encontrarse autenticado y haber cargado previamente los datos maestros del tenant mientras estaba en línea.<br>• El almacenamiento IndexedDB debe estar disponible y habilitado en el navegador del dispositivo. |
| **Flujo Principal** | 1. Durante la sesión conectada, el sistema descarga y actualiza en el almacén local IndexedDB (`FashionStoreOfflineDB`) las tablas maestras del tenant: catálogo de productos con códigos de barra y precios, stock local y lista de clientes.<br>2. Al perderse la conexión a internet (modo offline), el usuario (ej. un cajero en punto de venta POS o un cliente navegando la tienda) continúa operando normalmente.<br>3. El cajero escanea productos o agrega prendas al carrito de venta.<br>4. El sistema consulta los precios, variantes y datos de la prenda directamente desde las tablas locales de IndexedDB.<br>5. El cajero finaliza el registro de la venta seleccionando forma de pago en efectivo o comprobante manual.<br>6. El sistema genera un identificador local único (UUID v4 / correlativo offline temporal) para la transacción.<br>7. El sistema guarda la venta completa (cabecera, detalle de ítems, totales, fecha y cajero) en el almacén `pending_transactions` de IndexedDB con el estado `PENDIENTE_SINCRONIZACION`.<br>8. El sistema descuenta el stock de manera virtual en el almacén local para evitar que el cajero sobrevenda una prenda físicamente no disponible.<br>9. El sistema emite el comprobante o ticket de venta local indicando el sello distintivo: *"Registrado en Modo Offline — Pendiente de Sincronización"*.<br>10. El sistema presenta al cajero un contador persistente en la barra de estado con la cantidad de transacciones offline almacenadas localmente. |
| **Postcondiciones** | • La venta o registro queda persistido localmente de manera segura en el dispositivo sin pérdida de información comercial.<br>• El inventario local refleja de inmediato el descuento para mantener consistencia durante la jornada sin red. |
| **Excepciones** | • Límite de almacenamiento de IndexedDB excedido en el dispositivo cliente.<br>• Intento de registrar una operación que requiere verificación externa forzosa (ej. cobro en línea con tarjeta de crédito Stripe en vivo, para lo cual el sistema solicita pago en efectivo o registro posterior). |

---

## Caso de Uso: CU18 — Sincronizar Datos Offline a Online

| Caso de Uso: CU18 - Sincronizar Datos Offline a Online | Descripción |
| :--- | :--- |
| **Propósito** | Detectar el restablecimiento de la conexión a internet y orquestar el envío transaccional ordenado, validación atómica y resolución de conflictos de todas las operaciones registradas localmente en modo offline (ventas POS, movimientos de inventario y reservas) hacia la base de datos física del tenant en Azure PostgreSQL, garantizando la consistencia global del sistema. |
| **Actores** | Sistema (Background Sync / Service Worker), Cajero, Administrador. |
| **Iniciador** | Sistema (Automático al detectar conexión) / Cajero (Manual bajo demanda). |
| **Precondiciones** | • Deben existir transacciones en estado `PENDIENTE_SINCRONIZACION` almacenadas en IndexedDB.<br>• Debe restablecerse la conectividad estable a internet y el endpoint de sincronización del backend debe responder.<br>• El token de autenticación del usuario debe ser válido o revalidable. |
| **Flujo Principal** | 1. El sistema detecta el retorno de la conexión a internet mediante el evento `online` o la activación de la API `Background Sync` del Service Worker.<br>2. Alternativamente, el usuario pulsa el botón **Sincronizar Ahora** en el panel de control offline.<br>3. El sistema lee en IndexedDB la cola de transacciones pendientes ordenadas cronológicamente por timestamp de emisión.<br>4. El sistema muestra un indicador visual animado de sincronización en curso (*"Sincronizando X transacciones pendientes..."*).<br>5. El sistema agrupa las transacciones en un payload estructurado y las despacha al endpoint transaccional del backend (`POST /api/sales-billing/pos/sync-offline`).<br>6. El backend recibe el lote, abre una transacción atómica en la base de datos del tenant y procesa secuencialmente cada venta:<br>&nbsp;&nbsp;&nbsp;&nbsp;a. Valida la disponibilidad de stock real.<br>&nbsp;&nbsp;&nbsp;&nbsp;b. Asigna el número oficial correlativo de factura/ticket en la base de datos central.<br>&nbsp;&nbsp;&nbsp;&nbsp;c. Inserta el registro oficial en las tablas `VENTA` y `DETALLE_VENTA`.<br>&nbsp;&nbsp;&nbsp;&nbsp;d. Descuenta formalmente las unidades del inventario de la sucursal (`INVENTARIO_SUCURSAL`) y registra el movimiento oficial.<br>7. Si no se detectan colisiones, el backend confirma la persistencia exitosa de todas las transacciones con sus IDs oficiales definitivos.<br>8. El cliente recibe la confirmación positiva, actualiza el estado de las transacciones en IndexedDB a `SINCRONIZADO` y limpia la cola de pendientes.<br>9. El sistema emite una notificación de éxito: *"Sincronización completada exitosamente. X transacciones integradas a la nube"*.<br>10. El sistema registra en la bitácora del tenant el evento de sincronización masiva con cantidad de registros, IP y usuario autor. |
| **Postcondiciones** | • Las transacciones offline quedan firmemente asentadas en la base de datos PostgreSQL de producción del tenant.<br>• Se recupera la coherencia total entre el stock físico de la sucursal y el catálogo en línea.<br>• La cola local de IndexedDB queda limpia de pendientes. |
| **Excepciones** | • Conflicto de concurrencia / Quiebre de stock: Otra sucursal o la tienda online consumió el stock antes de la sincronización. El backend marca la transacción en estado `CONFLICTO_STOCK`, notifica al administrador con los detalles y genera una alerta para ajuste manual o reposición sin anular el resto del lote.<br>• Caída abrupta de la conexión durante el envío del lote: La transacción atómica en el backend se revierte mediante `ROLLBACK`, la cola local permanece intacta y el sistema reintenta automáticamente en el siguiente intervalo.<br>• Token de sesión expirado durante el período sin red: El sistema solicita reautenticación segura al cajero sin perder los datos guardados en IndexedDB antes de continuar con la sincronización. |
