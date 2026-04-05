import nodemailer from "nodemailer";

export async function sendAlert(severity: string, message: string) {
  const emailConfig = global.AppConfig?.email;
  if (!emailConfig) {
    console.error(
      "❌ Nenhuma configuração de email encontrada na tabela Config.",
    );
    return;
  }
  const transporter = nodemailer.createTransport(emailConfig);

  await transporter.sendMail({
    from: emailConfig.auth.user,
    to: emailConfig.to,
    subject: `[SQL ALERT] Severidade: ${severity}`,
    text: message,
  });
}
