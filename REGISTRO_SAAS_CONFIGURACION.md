# Registro SaaS en localhost y nube

## Local

Iniciar el backend desde `backend` con `npm run start:dev` (puerto predeterminado 3000). Iniciar el frontend desde `frontend` con `npm run dev`. `VITE_API_URL=http://localhost:3000` debe corresponder al puerto real. Si se utiliza `/api`, Vite dirige las solicitudes a `BACKEND_URL` o, por defecto, `http://127.0.0.1:3000`.

El proxy lee BACKEND_URL del archivo .env de Vite. Reiniciar Vite al cambiar variables. El backend requiere DATABASE_URL, JWT_SECRET y la configuración habitual del proyecto. La conexión de aprovisionamiento conserva las opciones SSL de DATABASE_URL; no fuerza SSL sobre un PostgreSQL local que no lo ofrece.

## Stripe

Configurar STRIPE_SECRET_KEY en el backend. Utilizar una clave de pruebas para las pruebas locales y tarjetas de pruebas únicamente dentro del Checkout oficial. No ingresar tarjetas en FashionStore: la landing abre Stripe en una nueva ventana.

Completar los datos de empresa, abrir Checkout, pagar, volver a la ventana original y pulsar «Ya pagué: verificar y crear empresa». Mantener abierta esa ventana para conservar los datos de registro. El backend verifica payment_status, empresa, plan y correo antes de aprovisionar. Los planes de prueba pueden registrarse sin pago.

Los planes de pago no pueden darse de alta con la referencia QR simulada. Este método requiere una integración de confirmación real antes de habilitar el alta automática.

El flujo actual cobra un periodo con `mode: payment`; no implementa renovaciones recurrentes automáticas ni aprovisionamiento por webhook. No cerrar la ventana original durante el pago. Si se pierde esa ventana tras pagar, debe recuperarse la sesión de pago antes de volver a cobrar.

## Despliegue

Configurar VITE_API_URL con la URL pública HTTPS del backend durante el build del frontend. El proxy de Vite solo existe en desarrollo. Configurar FRONTEND_URL con la URL pública HTTPS del frontend y NODE_ENV=production en el backend. Para desarrollo, Checkout acepta como retorno el origen localhost recibido; en producción usa FRONTEND_URL.

La cuenta PostgreSQL necesita permiso CREATEDB para el modelo de base por tenant. Incluir `Base de Datos/EsquemaEcommerce.sql` en el despliegue y garantizar almacenamiento persistente para los metadatos de empresas. Las variables de pago y base de datos deben configurarse como secretos de la plataforma de despliegue.

La compilación local no demuestra que las credenciales, permisos, conectividad y almacenamiento del despliegue estén correctamente configurados. Verificar el registro completo en un entorno de pruebas antes de aceptar cobros de producción.
