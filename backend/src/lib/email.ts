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

  /**
   * Envia notificação de novo contato de parceiro.
   * O email é enviado para o email comercial da Extreme Sports Competition
   * E uma cópia de confirmação é enviada para o email de contato informado.
   */
  async sendPartnerContact(data: {
    companyName: string;
    cnpj: string;
    contactName: string;
    contactEmail: string;
    eventType: string;
    eventDate: string;
    city: string;
    budget: string;
    services: string[];
    message: string;
  }): Promise<void> {
    const BUSINESS_EMAIL = "extremesportscompetition@gmail.com";

    // Formata os serviços como lista
    const servicesList = data.services.length > 0
      ? data.services.map(s => `<li>${s}</li>`).join("")
      : "<li>Nenhum serviço selecionado</li>";

    // Email para a equipe comercial
    await send({
      to: BUSINESS_EMAIL,
      subject: `🤝 Nova Solicitação de Parceria — ${data.companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#4169E1,#FF6B00);padding:24px 32px;">
            <h1 style="margin:0;font-size:24px;color:#FFFFFF;">⚡ Nova Solicitação de Parceria</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#4169E1;margin-top:0;">Dados da Empresa</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr><td style="padding:8px 0;color:#888;width:40%;">Empresa:</td><td style="padding:8px 0;color:#FFF;">${data.companyName}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">CNPJ:</td><td style="padding:8px 0;color:#FFF;">${data.cnpj || "Não informado"}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Responsável:</td><td style="padding:8px 0;color:#FFF;">${data.contactName}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Email:</td><td style="padding:8px 0;color:#FFF;"><a href="mailto:${data.contactEmail}" style="color:#4169E1;">${data.contactEmail}</a></td></tr>
            </table>

            <h2 style="color:#FF6B00;">Detalhes do Evento</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr><td style="padding:8px 0;color:#888;width:40%;">Tipo de Evento:</td><td style="padding:8px 0;color:#FFF;">${data.eventType || "Não informado"}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Data Prevista:</td><td style="padding:8px 0;color:#FFF;">${data.eventDate || "Não informada"}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Cidade:</td><td style="padding:8px 0;color:#FFF;">${data.city || "Não informada"}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Orçamento:</td><td style="padding:8px 0;color:#FFF;">${data.budget || "Não informado"}</td></tr>
            </table>

            <h2 style="color:#4169E1;">Serviços Desejados</h2>
            <ul style="color:#FFF;padding-left:20px;margin-bottom:24px;">${servicesList}</ul>

            ${data.message ? `
              <h2 style="color:#FF6B00;">Mensagem</h2>
              <p style="color:#FFF;background:#1a1a1a;padding:16px;border-radius:8px;border-left:3px solid #FF6B00;">${data.message}</p>
            ` : ""}

            <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
            <p style="color:#666;font-size:12px;">Email enviado automaticamente pela plataforma Extreme Sports Competition.</p>
          </div>
        </div>
      `,
    });

    // Email de confirmação para o parceiro
    await send({
      to: data.contactEmail,
      subject: "⚡ Recebemos sua solicitação — Extreme Sports Competition",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#4169E1,#FF6B00);padding:24px 32px;">
            <h1 style="margin:0;font-size:24px;color:#FFFFFF;">⚡ Extreme Sports Competition</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#4169E1;margin-top:0;">Olá, ${data.contactName}!</h2>
            <p style="color:#CCC;line-height:1.6;">
              Recebemos sua solicitação de parceria para a empresa <strong style="color:#FFF;">${data.companyName}</strong>.
            </p>
            <p style="color:#CCC;line-height:1.6;">
              Nossa equipe comercial analisará sua proposta e entrará em contato em até <strong style="color:#FF6B00;">24 horas</strong>.
            </p>
            <p style="color:#CCC;line-height:1.6;">
              Enquanto isso, fique à vontade para nos contatar diretamente:
            </p>
            <ul style="color:#CCC;line-height:2;">
              <li>📧 <a href="mailto:extremesportscompetition@gmail.com" style="color:#4169E1;">extremesportscompetition@gmail.com</a></li>
              <li>📞 (51) 98148-4895</li>
            </ul>
            <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
            <p style="color:#666;font-size:12px;">Extreme Sports Competition — Saúde e movimento para quem move o mundo.</p>
          </div>
        </div>
      `,
    });
  },
};
