"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlert = sendAlert;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendAlert(severity, message) {
    const emailConfig = global.AppConfig?.email;
    if (!emailConfig) {
        console.error("❌ Nenhuma configuração de email encontrada na tabela Config.");
        return;
    }
    const transporter = nodemailer_1.default.createTransport(emailConfig);
    await transporter.sendMail({
        from: emailConfig.auth.user,
        to: emailConfig.to,
        subject: `[SQL ALERT] Severidade: ${severity}`,
        text: message,
    });
}
