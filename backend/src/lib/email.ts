import { env } from "./env";

// ============================================================
// Serviço de e-mail — stub pronto para integração
// Em dev: loga no console. Em produção: wire up Resend/SendGrid.
// ============================================================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function send(options: EmailOptions): Promise<void> {
  if (env.NODE_ENV !== "production") {
    console.log("\n📧 [EMAIL STUB]");
    console.log(`  Para: ${options.to}`);
    console.log(`  Assunto: ${options.subject}`);
    console.log(`  HTML: ${options.html.slice(0, 200)}...`);
    console.log("");
    return;
  }

  // TODO: integrar com Resend (recomendado) ou SendGrid
  // Exemplo com Resend:
  // const resend = new Resend(env.RESEND_API_KEY)
  // await resend.emails.send({ from: 'noreply@extremecompetition.com.br', ...options })

  throw new Error("Provedor de e-mail não configurado para produção.");
}

export const email = {
  async sendVerification(to: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.APP_URL ?? "http://localhost:5173"}/verify-email?token=${token}`;
    await send({
      to,
      subject: "⚡ Confirme seu e-mail — Extreme Competition",
      html: `
        <h2>Bem-vindo à Extreme Competition!</h2>
        <p>Clique no link abaixo para confirmar seu e-mail:</p>
        <a href="${verifyUrl}" style="background:#00FF87;color:#0A0A0A;padding:12px 24px;text-decoration:none;font-weight:700;border-radius:4px;">
          Confirmar E-mail
        </a>
        <p>Este link expira em <strong>24 horas</strong>.</p>
        <p>Se você não criou uma conta, ignore este e-mail.</p>
      `,
    });
  },

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL ?? "http://localhost:5173"}/reset-password?token=${token}`;
    await send({
      to,
      subject: "⚡ Redefinição de senha — Extreme Competition",
      html: `
        <h2>Redefinição de senha</h2>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}" style="background:#FF4D00;color:#FFFFFF;padding:12px 24px;text-decoration:none;font-weight:700;border-radius:4px;">
          Redefinir Senha
        </a>
        <p>Este link expira em <strong>1 hora</strong>.</p>
        <p>Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
      `,
    });
  },
};
