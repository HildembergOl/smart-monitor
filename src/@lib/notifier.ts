import nodemailer from "nodemailer";
import { dbSqlite } from "../database/sqlite";

export async function sendAlert(severity: string, message: string) {
  const emailConfig = global.AppConfig?.email;
  if (!emailConfig) {
    console.error(
      "❌ Nenhuma configuração de email encontrada na tabela Config.",
    );
    return;
  }

  try {
    console.log(`📧 Tentando enviar alerta por email (${severity})...`);
    // Ajuste automático de segurança baseado na porta
    const isSSL = emailConfig.port === 465;
    const transportOptions = {
      ...emailConfig,
      secure: isSSL,
      tls: {
        rejectUnauthorized: false,
      },
    };

    const transporter = nodemailer.createTransport(transportOptions);
    const enterprise = global.AppConfig?.enterprise || "CLIENTE_DESCONHECIDO";

    await transporter.sendMail({
      from: emailConfig.auth.user,
      to: emailConfig.to,
      subject: `🚨 [SQL MONITOR] ${enterprise.toUpperCase()} - ALERTA: ${severity.toUpperCase()}`,
      text: `Empresa: ${enterprise}\nSeveridade: ${severity}\n\nMensagem:\n${message}`,
    });
    console.log("✅ Alerta de email enviado com sucesso!");

    // Salva no log local do SQLite
    try {
      const db = await dbSqlite();
      await db.run("INSERT INTO ALERTS (severity, message) VALUES (?, ?)", [
        severity.toUpperCase(),
        message,
      ]);
    } catch (dbErr) {
      console.error("⚠️ Falha ao salvar alerta no SQLite:", dbErr);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Erro ao enviar email:", error.message);
    } else {
      console.error("❌ Erro desconhecido ao enviar email:", error);
    }
  }
}
