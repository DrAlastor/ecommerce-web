-- Aplicar explícitamente en cada base tenant, después de respaldar y validar en pruebas.
BEGIN;
CREATE TABLE IF NOT EXISTS offline_cash_session (
  id uuid PRIMARY KEY,
  user_id integer NOT NULL REFERENCES usuario(id_usuario),
  branch_id integer NOT NULL REFERENCES sucursal(id_sucursal),
  terminal varchar(100) NOT NULL,
  initial_minor integer NOT NULL CHECK (initial_minor >= 0),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  counted_minor integer CHECK (counted_minor >= 0),
  expected_minor bigint,
  difference_minor bigint,
  closing_manifest jsonb,
  closed_by integer REFERENCES usuario(id_usuario)
);
CREATE UNIQUE INDEX IF NOT EXISTS offline_cash_one_open_branch ON offline_cash_session(branch_id) WHERE closed_at IS NULL;
CREATE TABLE IF NOT EXISTS offline_preparation (
  id uuid PRIMARY KEY,
  user_id integer NOT NULL REFERENCES usuario(id_usuario),
  branch_id integer NOT NULL REFERENCES sucursal(id_sucursal),
  terminal varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  catalog jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS offline_operation (
  id uuid PRIMARY KEY,
  preparation_id uuid NOT NULL REFERENCES offline_preparation(id),
  user_id integer NOT NULL REFERENCES usuario(id_usuario),
  payload_hash varchar(64) NOT NULL,
  payload jsonb NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offline_operation_user ON offline_operation(user_id, created_at);
ALTER TABLE offline_preparation ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES offline_cash_session(id);
ALTER TABLE offline_cash_session ADD COLUMN IF NOT EXISTS closing_note text;
CREATE TABLE IF NOT EXISTS offline_resolution (
  id uuid PRIMARY KEY,
  operation_id uuid NOT NULL REFERENCES offline_operation(id),
  user_id integer NOT NULL REFERENCES usuario(id_usuario),
  action varchar(30) NOT NULL,
  note text NOT NULL,
  before_response jsonb NOT NULL,
  after_response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
