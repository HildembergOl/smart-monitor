export interface BackupConfig {
  local_path: string;
  remote_path: string;
  compressao: boolean;
  full: boolean;
  diferencial: boolean;
  transacao: boolean;
  retencao: number;
  time_full: string[];
  time_diferencial: string[];
  time_transacao: string[];
}

export interface AmbienteConfig {
  user: string;
  password: string;
  server: string;
  database: string;
  port: number;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  to: string;
}

export interface AppConfiguration {
  enterprise: string;
  ambiente: {
    local: AmbienteConfig;
    producao: AmbienteConfig;
  };
  email: EmailConfig;
  backup: BackupConfig;
}
