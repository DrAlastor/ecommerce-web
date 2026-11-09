# Especificación Detallada de Casos de Uso — Módulo 1 (Seguridad y SaaS)

> **Sistema:** FashionStore SaaS Multi-Tenant  
> **Módulo 1:** Usuarios y Seguridad  
> **Estándar:** Plantilla ICONIX / UML 2.5 OMG  
> **Casos de Uso:** CU07, CU08, CU09

---

## Caso de Uso: CU07 — Gestionar Empresas

| Caso de Uso: CU07 - Gestionar Empresas | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador (o Superadministrador) registrar, consultar y actualizar la información corporativa, legal y de contacto del inquilino SaaS (Razón Social, Nombre Comercial, NIT, País, Moneda principal/secundaria, logo, dirección fiscal y correo oficial), asegurando la correcta parametrización de su identidad empresarial en la plataforma. |
| **Actores** | Administrador, Superadministrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión con credenciales válidas en su tenant.<br>• Debe contar con el permiso asignado para gestionar empresas (CU07).<br>• El inquilino SaaS debe encontrarse en estado ACTIVO en la base de datos central. |
| **Flujo Principal** | 1. El Administrador ingresa al módulo **Configuración de Empresa** desde el menú administrativo.<br>2. El sistema consulta y recupera los datos corporativos actuales registrados en el esquema (Razón Social, Nombre Comercial, NIT, País, Monedas y datos de contacto).<br>3. El sistema presenta el formulario de configuración empresarial con la información precargada.<br>4. El Administrador revisa los datos y modifica los campos requeridos (Nombre comercial, teléfono, dirección fiscal, email corporativo o monedas operativas).<br>5. Opcionalmente, el Administrador selecciona y sube un nuevo archivo de logotipo corporativo (JPG/PNG).<br>6. El Administrador pulsa el botón **Guardar Cambios**.<br>7. El sistema valida el formato de NIT, estructura del correo electrónico, longitud de campos y tamaño/formato del archivo de logotipo.<br>8. El sistema actualiza el registro en la base de datos y almacena el logo en Azure Blob Storage (`fashionstorestorages`) si fue modificado.<br>9. El sistema emite un mensaje de confirmación de éxito.<br>10. El sistema registra la operación en la bitácora de auditoría con fecha, hora, dirección IP y usuario responsable. |
| **Postcondiciones** | • Los datos corporativos de la empresa quedan actualizados y vigentes para facturación y cabeceras de tienda.<br>• El nuevo logotipo e información se reflejan de inmediato en la vitrina digital del tenant.<br>• La acción queda registrada de manera inmutable en la bitácora. |
| **Excepciones** | • El NIT ingresado no cumple con el formato tributario legal o ya se encuentra registrado por otra empresa.<br>• El archivo de logotipo excede el tamaño máximo permitido (2 MB) o formato no soportado.<br>• El correo corporativo ingresado posee un formato sintáctico inválido.<br>• El Administrador no cuenta con permisos de escritura sobre la configuración empresarial. |

---

## Caso de Uso: CU08 — Personalizar Apariencia

| Caso de Uso: CU08 - Personalizar Apariencia | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador personalizar la identidad visual de la tienda online del tenant (paleta de colores primario, secundario y acento, tipografías, banners promocionales y modo de visualización), logrando que la vitrina digital refleje la personalidad de su marca sin requerir código. |
| **Actores** | Administrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión en el panel administrativo.<br>• Debe contar con el permiso para personalizar la apariencia de la tienda (CU08).<br>• Debe existir un catálogo de productos activo en el tenant para previsualizar los cambios. |
| **Flujo Principal** | 1. El Administrador ingresa al módulo **Personalizar Apariencia**.<br>2. El sistema carga la configuración visual vigente (color primario, secundario, acento, tipografía seleccionada y banners actuales).<br>3. El sistema muestra la interfaz de personalización con un visor de previsualización interactiva en tiempo real (*Live Preview*).<br>4. El Administrador selecciona o ajusta los códigos cromáticos hexadecimales mediante el selector de color (*Color Picker*).<br>5. El Administrador elige la familia tipográfica para títulos y texto entre las opciones admitidas por la plataforma.<br>6. El Administrador carga o actualiza los banners de la portada principal (Hero Banner y banners de temporada).<br>7. El sistema actualiza la previsualización en vivo mostrando cómo lucirá la tienda en versiones escritorio y móvil.<br>8. El Administrador presiona **Aplicar y Publicar Tema**.<br>9. El sistema valida los formatos de color y dimensiones de las imágenes de banner.<br>10. El sistema guarda la configuración en la base de datos y genera las variables de estilo CSS del tenant.<br>11. El sistema muestra un mensaje de éxito y registra el cambio en la bitácora con los valores previos y nuevos. |
| **Postcondiciones** | • La tienda pública del tenant adopta inmediatamente los nuevos colores, tipografías y banners.<br>• Las preferencias visuales se persisten para todas las sesiones de clientes visitantes.<br>• La modificación queda registrada en la bitácora con trazabilidad de cambios. |
| **Excepciones** | • Los códigos de color ingresados no cumplen con el formato hexadecimal válido (`#RRGGBB`).<br>• La imagen de banner no cumple con las dimensiones recomendadas (1600x900) o excede el límite de peso.<br>• Falla de conectividad con el almacenamiento en la nube Azure Blob al subir los banners.<br>• El Administrador carece de permisos para modificar el diseño visual. |

---

## Caso de Uso: CU09 — Gestionar Backups y Restore

| Caso de Uso: CU09 - Gestionar Backups y Restore | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador generar respaldos completos bajo demanda de la base de datos de su tenant, descargar copias de seguridad en formato comprimido (.sql.gz), consultar el historial de backups y solicitar o ejecutar restauraciones a un punto de recuperación previo de forma segura e íntegra. |
| **Actores** | Administrador, Superadministrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión con credenciales de nivel administrativo.<br>• Debe contar con el permiso de gestión de backups y restore (CU09).<br>• El servicio de almacenamiento Azure Blob Storage (`fashionstorestorages`) debe encontrarse en línea y disponible. |
| **Flujo Principal** | 1. El Administrador ingresa a la sección **Backups y Restauración** dentro de Usuarios y Seguridad.<br>2. El sistema consulta y lista el historial de copias de seguridad existentes (fecha, hora, tamaño, checksum SHA-256, tipo y estado en Azure Blob).<br>3. El Administrador selecciona la acción **Generar Backup Bajo Demanda**.<br>4. El sistema solicita confirmación y una etiqueta descriptiva opcional para el respaldo.<br>5. El Administrador confirma la operación.<br>6. El sistema ejecuta el volcado lógico exclusivo del esquema del tenant (`pg_dump -n tenant_xxx`), lo comprime en `.sql.gz` y calcula su hash SHA-256.<br>7. El sistema sube el archivo empaquetado al contenedor privado de Azure Blob Storage.<br>8. El sistema registra el respaldo en la tabla histórica con su URL segura, tamaño y checksum.<br>9. El sistema notifica al Administrador que el respaldo se generó con éxito y habilita su descarga o restauración.<br>10. Opcionalmente, para restaurar, el Administrador selecciona un backup del historial y pulsa **Restaurar Esquema**.<br>11. El sistema solicita reautenticación de seguridad (ingreso de contraseña de Administrador) para confirmar la restauración.<br>12. El sistema restaura el esquema del tenant al estado de dicho respaldo de forma atómica.<br>13. El sistema registra la operación de backup o restore en la bitácora global y local. |
| **Postcondiciones** | • Se genera una copia de seguridad íntegra y verificada en Azure Blob Storage.<br>• En caso de restore, los datos del tenant vuelven al estado exacto de la fecha seleccionada sin afectar a otros inquilinos.<br>• La acción queda registrada en el historial de backups/restauraciones y en la bitácora de auditoría. |
| **Excepciones** | • Espacio insuficiente en el almacenamiento de blobs o cuota del plan excedida.<br>• Fallo en la autenticación con la contraseña maestra al intentar una restauración.<br>• El archivo de backup presenta discrepancia en el checksum SHA-256 (archivo corrupto o alterado).<br>• Pérdida de conexión con el motor de base de datos durante el volcado o restauración. |

---

## Caso de Uso: CU10 — Consultar Bitácora (Plantilla de Referencia)

*(Nota: En el catálogo general del sistema corresponde al CU10, provisto según el formato y contenido de su plantilla).*

| Caso de Uso: CU10 - Consultar bitácora | Descripción |
| :--- | :--- |
| **Propósito** | Permitir al Administrador consultar el historial de acciones realizadas en el sistema para identificar operaciones, fechas y usuarios responsables. |
| **Actores** | Administrador. |
| **Iniciador** | Administrador. |
| **Precondiciones** | • El Administrador debe haber iniciado sesión.<br>• Debe contar con permiso para consultar la bitácora. |
| **Flujo Principal** | 1. El Administrador ingresa al módulo **Bitácora**.<br>2. El sistema obtiene los registros de auditoría.<br>3. El sistema muestra la acción, entidad afectada, fecha, hora, dirección IP y usuario responsable.<br>4. El Administrador revisa los registros mostrados.<br>5. El Administrador puede buscar por acción, entidad, correo o nombre del usuario.<br>6. Puede filtrar los registros por usuario.<br>7. El sistema actualiza los resultados de acuerdo con los criterios ingresados.<br>8. El Administrador puede desplazarse entre las páginas de resultados.<br>9. El sistema registra que la bitácora fue consultada. |
| **Postcondiciones** | • El Administrador obtiene la información histórica solicitada.<br>• Los registros originales no son modificados.<br>• La consulta queda registrada en la propia bitácora. |
| **Excepciones** | • No existen registros que coincidan con la búsqueda.<br>• El usuario utilizado como filtro no existe.<br>• El Administrador no posee permiso de lectura. |
