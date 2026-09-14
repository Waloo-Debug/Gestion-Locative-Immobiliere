import nodemailer from "nodemailer";

export type InviteEmailPayload = {
  to: string;
  inviterName: string;
  propertyLabel: string;
  inviteUrl: string;
};

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_FROM || process.env.SMTP_USER),
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  // Gmail affiche souvent le mot de passe d'application avec des espaces.
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass,
    },
  });
}

export async function sendCoownerInviteEmail(payload: InviteEmailPayload) {
  if (!isMailConfigured()) {
    throw new Error(
      "Envoi d’e-mail non configuré. Renseigne SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM (mêmes réglages que l’e-mail Auth Supabase).",
    );
  }

  // Gmail exige en pratique l'adresse authentifiée comme expéditeur.
  const from = process.env.SMTP_FROM?.includes("@")
    ? process.env.SMTP_FROM
    : process.env.SMTP_FROM
      ? `${process.env.SMTP_FROM} <${process.env.SMTP_USER}>`
      : process.env.SMTP_USER!;
  const subject = `${payload.inviterName} vous invite à la co-gestion d’un bien — Locagest`;

  const text = [
    `Bonjour,`,
    ``,
    `${payload.inviterName} vous a invité(e) à rejoindre la co-gestion du bien suivant :`,
    payload.propertyLabel,
    ``,
    `Veuillez cliquer sur le lien ci-dessous pour accepter l’invitation.`,
    `Utilisez l’adresse ${payload.to} pour vous connecter ou créer votre compte Locagest.`,
    ``,
    payload.inviteUrl,
    ``,
    `Si vous n’êtes pas concerné(e) par cette invitation, ignorez cet e-mail.`,
    ``,
    `— Locagest`,
  ].join("\n");

  const html = `
    <p>Bonjour,</p>
    <p><strong>${escapeHtml(payload.inviterName)}</strong> vous a invité(e) à rejoindre la co-gestion du bien suivant :</p>
    <p><strong>${escapeHtml(payload.propertyLabel)}</strong></p>
    <p>Veuillez cliquer sur le bouton ci-dessous pour accepter l’invitation.<br/>
    Utilisez l’adresse <strong>${escapeHtml(payload.to)}</strong> pour vous connecter ou créer votre compte Locagest.</p>
    <p style="margin:24px 0;">
      <a href="${escapeHtml(payload.inviteUrl)}"
         style="display:inline-block;background:#1e5a6e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
        Rejoindre la co-gestion
      </a>
    </p>
    <p style="font-size:12px;color:#64748b;">Ou copiez ce lien :<br/>${escapeHtml(payload.inviteUrl)}</p>
    <p style="font-size:12px;color:#64748b;">Si vous n’êtes pas concerné(e) par cette invitation, ignorez cet e-mail.</p>
    <p>— Locagest</p>
  `;

  const transport = createTransport();
  await transport.sendMail({
    from,
    to: payload.to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
