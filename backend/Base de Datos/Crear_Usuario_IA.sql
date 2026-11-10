-- ==============================================================================
-- Script de Creación de Usuario de Solo Lectura para Inteligencia Artificial
-- Base de Datos: PostgreSQL (Dressly SaaS)
-- Propósito: Consultas analíticas seguras y reportes por voz / lenguaje natural
-- ==============================================================================

-- 1. Crear el rol / usuario con contraseña segura si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_readonly') THEN
    CREATE ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_secure_pass_2026';
  ELSE
    ALTER ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_secure_pass_2026';
  END IF;
END
$$;

-- 2. Conceder conexión a la base de datos y uso del esquema público
GRANT CONNECT ON DATABASE dressly_db TO ai_readonly;
GRANT USAGE ON SCHEMA public TO ai_readonly;

-- 3. Conceder SELECT general sobre todas las tablas de negocio
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ai_readonly;

-- 4. Revocar expresamente todos los permisos de escritura, alteración o borrado
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM ai_readonly;
REVOKE CREATE ON SCHEMA public FROM ai_readonly;

-- 5. Blindaje de seguridad sobre columnas sensibles
-- Revocar lectura completa de la tabla usuario y conceder solo columnas no confidenciales
REVOKE SELECT ON usuario FROM ai_readonly;
GRANT SELECT (id_usuario, email, estado, id_rol) ON usuario TO ai_readonly;

-- Bloquear tokens temporales de recuperación
REVOKE SELECT ON token_recuperacion FROM ai_readonly;

-- 6. Limitar el tiempo de ejecución a 4 segundos para evitar sobrecargas
ALTER ROLE ai_readonly SET statement_timeout = '4000';

