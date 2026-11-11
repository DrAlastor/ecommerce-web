# Transcripción de reportes por voz

El reconocimiento del navegador depende de su servicio de voz y puede fallar incluso en Chrome o Edge. La pantalla incluye una alternativa: **Grabar con transcriptor del servidor**.

Para habilitarla, el administrador debe iniciar un servidor Whisper compatible con `POST /v1/audio/transcriptions`, que acepte multipart (`file`, `model`, `language`) y devuelva `{ "text": "..." }`. Debe poder decodificar WebM/Opus y los formatos de audio que produzcan los navegadores admitidos. No basta con ejecutar Ollama: un modelo de texto no transcribe estas grabaciones.

Configurar en el entorno del backend (ejemplo de dirección local, no de un servicio instalado):

```dotenv
REPORTS_STT_URL=http://127.0.0.1:8000/v1/audio/transcriptions
REPORTS_STT_MODEL=whisper-1
```

Reiniciar el backend tras configurar. El servicio debe ser accesible desde el backend; en contenedores, localhost se refiere al mismo contenedor. La integración actual está destinada a un transcriptor privado sin autenticación adicional. No publicar ese servicio directamente en Internet.

La grabación requiere HTTPS o localhost y permiso del micrófono. Al detenerla (o llegar a 60 segundos), se envía al backend autenticado y se transcribe. La aplicación no almacena archivos de audio. El servicio externo debe tener su propia política de retención configurada.

Verificación funcional pendiente: grabar una consulta real, detener, comprobar transcripción y respuesta; repetir con permisos denegados y servicio detenido. Sin el servicio configurado, el botón muestra un error explícito y no simula una transcripción.
