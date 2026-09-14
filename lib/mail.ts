import nodemailer from "nodemailer";

export type InviteEmailPayload = {
  to: string;
  inviterName: string;
  propertyLabel: string;
  inviteUrl: string;
};

function readSmtpEnv() {
  return {
    host: process.env.SMTP_HOST?.trim() || "",
    port: process.env.SMTP_PORT?.trim() || "465",
    user: process.env.SMTP_USER?.trim() || "",
    pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    from: process.env.SMTP_FROM?.trim() || "",
  };
}

export function missingSmtpEnvKeys() {
  const env = readSmtpEnv();
  const missing: string[] = [];
  if (!env.host) missing.push("SMTP_HOST");
  if (!env.user) missing.push("SMTP_USER");
  if (!env.pass) missing.push("SMTP_PASS");
  return missing;
}

export function isMailConfigured() {
  return missingSmtpEnvKeys().length === 0;
}

function createTransport() {
  const env = readSmtpEnv();
  const port = Number(env.port || 465);
  return nodemailer.createTransport({
    host: env.host,
    port,
    secure: port === 465,
    auth: {
      user: env.user,
      pass: env.pass,
    },
  });
}

export async function sendCoownerInviteEmail(payload: InviteEmailPayload) {
  const missing = missingSmtpEnvKeys();
  if (missing.length > 0) {
    throw new Error(
      `Envoi d’e-mail non configuré (manque : ${missing.join(", ")}). Redémarre \`next dev\` après avoir renseigné .env.local.`,
    );
  }

  const env = readSmtpEnv();
  // Gmail exige en pratique l'adresse authentifiée comme expéditeur.
  const from = env.from.includes("@")
    ? env.from
    : env.from
      ? `${env.from} <${env.user}>`
      : env.user;
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
