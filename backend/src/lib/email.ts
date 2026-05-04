import { Resend } from "resend";
import { env } from "./env";

// ============================================================
// Serviço de e-mail — Resend
//
// Em dev sem RESEND_API_KEY: loga no console (não bloqueia).
// Em produção: requer RESEND_API_KEY configurada no ambiente.
// ============================================================

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

async function send(options: EmailOptions): Promise<void> {
  const resend = getResend();

  if (!resend) {
    // Stub para dev — não bloqueia se RESEND_API_KEY não estiver configurada
    console.log("\n📧 [EMAIL STUB — configure RESEND_API_KEY para enviar de verdade]");
    console.log(`  Para:    ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    console.log(`  Assunto: ${options.subject}`);
    console.log(`  HTML:    ${options.html.slice(0, 300)}...`);
    console.log("");
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// ============================================================
// Templates
// ============================================================

function header(title: string, accentColor = "#4169E1"): string {
  return `
    <div style="background:linear-gradient(135deg,${accentColor},${accentColor}99);padding:24px 32px;">
      <h1 style="margin:0;font-size:22px;color:#FFFFFF;font-family:Arial,sans-serif;">${title}</h1>
    </div>
  `;
}

function footer(): string {
  return `
    <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
    <p style="color:#555;font-size:12px;font-family:Arial,sans-serif;margin:0;">
      E-mail enviado automaticamente pela plataforma Extreme Sports Competition.<br/>
      Não responda a este e-mail — use <a href="mailto:${env.EMAIL_FINANCIAL}" style="color:#4169E1;">${env.EMAIL_FINANCIAL}</a> para entrar em contato.
    </p>
  `;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#888;width:40%;font-family:Arial,sans-serif;">${label}</td>
    <td style="padding:8px 0;color:#FFF;font-family:Arial,sans-serif;">${value || "<em style='color:#555'>Não informado</em>"}</td>
  </tr>`;
}

// ============================================================
// Emails públicos
// ============================================================

export const email = {
  async sendVerification(to: string, token: string): Promise<void> {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await send({
      to,
      subject: "⚡ Confirme seu e-mail — Extreme Competition",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          ${header("⚡ Extreme Sports Competition")}
          <div style="padding:32px;">
            <h2 style="color:#00FF87;margin-top:0;">Confirme seu e-mail</h2>
            <p style="color:#CCC;line-height:1.6;">Clique no botão abaixo para confirmar seu cadastro:</p>
            <a href="${verifyUrl}" style="display:inline-block;background:#00FF87;color:#0A0A0A;padding:14px 28px;text-decoration:none;font-weight:700;border-radius:8px;font-family:Arial,sans-serif;">
              Confirmar E-mail
            </a>
            <p style="color:#666;margin-top:24px;font-size:14px;">Este link expira em <strong style="color:#FFF;">24 horas</strong>.</p>
            <p style="color:#666;font-size:14px;">Se você não criou uma conta, ignore este e-mail.</p>
            ${footer()}
          </div>
        </div>
      `,
    });
  },

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await send({
      to,
      subject: "⚡ Redefinição de senha — Extreme Competition",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          ${header("⚡ Extreme Sports Competition", "#FF4D00")}
          <div style="padding:32px;">
            <h2 style="color:#FF4D00;margin-top:0;">Redefinição de senha</h2>
            <p style="color:#CCC;line-height:1.6;">Clique no botão abaixo para redefinir sua senha:</p>
            <a href="${resetUrl}" style="display:inline-block;background:#FF4D00;color:#FFFFFF;padding:14px 28px;text-decoration:none;font-weight:700;border-radius:8px;font-family:Arial,sans-serif;">
              Redefinir Senha
            </a>
            <p style="color:#666;margin-top:24px;font-size:14px;">Este link expira em <strong style="color:#FFF;">1 hora</strong>.</p>
            <p style="color:#666;font-size:14px;">Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece a mesma.</p>
            ${footer()}
          </div>
        </div>
      `,
    });
  },

  // ------------------------------------------------------------------
  // Proposta de evento (Crie Eventos Conosco)
  // Notifica financeiro@ e envia confirmação ao solicitante
  // ------------------------------------------------------------------
  async sendEventProposalNotification(data: {
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
    const servicesList =
      data.services.length > 0
        ? data.services.map((s) => `<li style="color:#FFF;font-family:Arial,sans-serif;">${s}</li>`).join("")
        : `<li style="color:#555;font-family:Arial,sans-serif;">Nenhum serviço selecionado</li>`;

    // Email interno para o financeiro
    await send({
      to: env.EMAIL_FINANCIAL,
      subject: `🗓️ Nova Proposta de Evento — ${data.companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          ${header("🗓️ Nova Proposta de Evento", "#00FF87")}
          <div style="padding:32px;">
            <h2 style="color:#00FF87;margin-top:0;">Dados do Organizador</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              ${row("Empresa / Organizador:", data.companyName)}
              ${row("CNPJ:", data.cnpj)}
              ${row("Responsável:", data.contactName)}
              ${row("Email:", `<a href="mailto:${data.contactEmail}" style="color:#00FF87;">${data.contactEmail}</a>`)}
            </table>

            <h2 style="color:#00FF87;">Detalhes do Evento</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              ${row("Tipo de Evento:", data.eventType)}
              ${row("Data Prevista:", data.eventDate)}
              ${row("Cidade:", data.city)}
              ${row("Orçamento:", data.budget)}
            </table>

            <h2 style="color:#00FF87;">Serviços Necessários</h2>
            <ul style="padding-left:20px;margin-bottom:24px;">${servicesList}</ul>

            ${
              data.message
                ? `<h2 style="color:#00FF87;">Mensagem</h2>
                   <p style="color:#FFF;background:#1a1a1a;padding:16px;border-radius:8px;border-left:3px solid #00FF87;">${data.message}</p>`
                : ""
            }
            ${footer()}
          </div>
        </div>
      `,
    });

    // Email de confirmação para o solicitante
    await send({
      to: data.contactEmail,
      subject: "⚡ Recebemos sua proposta — Extreme Sports Competition",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          ${header("⚡ Extreme Sports Competition", "#00FF87")}
          <div style="padding:32px;">
            <h2 style="color:#00FF87;margin-top:0;">Olá, ${data.contactName}!</h2>
            <p style="color:#CCC;line-height:1.6;">
              Recebemos sua proposta de evento da <strong style="color:#FFF;">${data.companyName}</strong>.
            </p>
            <p style="color:#CCC;line-height:1.6;">
              Nossa equipe analisará sua proposta e entrará em contato em até <strong style="color:#00FF87;">24 horas</strong>.
            </p>
            <p style="color:#CCC;line-height:1.6;">Caso precise de retorno antes, fale diretamente:</p>
            <ul style="color:#CCC;line-height:2;">
              <li>📧 <a href="mailto:${env.EMAIL_FINANCIAL}" style="color:#00FF87;">${env.EMAIL_FINANCIAL}</a></li>
            </ul>
            ${footer()}
          </div>
        </div>
      `,
    });
  },

  // ------------------------------------------------------------------
  // Proposta de patrocínio (Seja Parceiro)
  // Notifica financeiro@ e envia confirmação ao solicitante
  // ------------------------------------------------------------------
  async sendSponsorProposalNotification(data: {
    companyName: string;
    cnpj: string;
    contactName: string;
    contactEmail: string;
    sponsorshipPackage: string;
    message: string;
  }): Promise<void> {
    // Email interno para o financeiro
    await send({
      to: env.EMAIL_FINANCIAL,
      subject: `🤝 Nova Proposta de Patrocínio — ${data.companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          ${header("🤝 Nova Proposta de Patrocínio", "#4169E1")}
          <div style="padding:32px;">
            <h2 style="color:#4169E1;margin-top:0;">Dados da Empresa</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              ${row("Empresa:", data.companyName)}
              ${row("CNPJ:", data.cnpj)}
              ${row("Responsável:", data.contactName)}
              ${row("Email:", `<a href="mailto:${data.contactEmail}" style="color:#4169E1;">${data.contactEmail}</a>`)}
              ${row("Pacote de Interesse:", data.sponsorshipPackage)}
            </table>

            ${
              data.message
                ? `<h2 style="color:#4169E1;">Mensagem</h2>
                   <p style="color:#FFF;background:#1a1a1a;padding:16px;border-radius:8px;border-left:3px solid #4169E1;">${data.message}</p>`
                : ""
            }
            ${footer()}
          </div>
        </div>
      `,
    });

    // Email de confirmação para o solicitante
    await send({
      to: data.contactEmail,
      subject: "⚡ Recebemos sua proposta de patrocínio — Extreme Sports Competition",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;border-radius:12px;overflow:hidden;">
          ${header("⚡ Extreme Sports Competition", "#4169E1")}
          <div style="padding:32px;">
            <h2 style="color:#4169E1;margin-top:0;">Olá, ${data.contactName}!</h2>
            <p style="color:#CCC;line-height:1.6;">
              Recebemos a proposta de patrocínio da <strong style="color:#FFF;">${data.companyName}</strong>
              ${data.sponsorshipPackage ? ` para o pacote <strong style="color:#4169E1;">${data.sponsorshipPackage}</strong>` : ""}.
            </p>
            <p style="color:#CCC;line-height:1.6;">
              Nossa equipe comercial entrará em contato em até <strong style="color:#4169E1;">24 horas</strong> com mais detalhes.
            </p>
            <p style="color:#CCC;line-height:1.6;">Precisa de retorno antes? Fale diretamente:</p>
            <ul style="color:#CCC;line-height:2;">
              <li>📧 <a href="mailto:${env.EMAIL_FINANCIAL}" style="color:#4169E1;">${env.EMAIL_FINANCIAL}</a></li>
            </ul>
            ${footer()}
          </div>
        </div>
      `,
    });
  },

  // Mantido para compatibilidade retroativa — redireciona para o novo método
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
    return this.sendEventProposalNotification(data);
  },
};
