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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mailFrom() {
  const env = readSmtpEnv();
  return env.from.includes("@")
    ? env.from
    : env.from
      ? `${env.from} <${env.user}>`
      : env.user;
}

function assertMailReady() {
  const missing = missingSmtpEnvKeys();
  if (missing.length > 0) {
    throw new Error(
      `Envoi d’e-mail non configuré (manque : ${missing.join(", ")}). Configure SMTP_* (local ou Vercel).`,
    );
  }
}

export async function sendCoownerInviteEmail(payload: InviteEmailPayload) {
  assertMailReady();
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

  await createTransport().sendMail({
    from: mailFrom(),
    to: payload.to,
    subject,
    text,
    html,
  });
}

export type RentReminderEmailPayload = {
  to: string;
  propertyLabel: string;
  tenantName: string;
  periodLabel: string;
  amountLabel: string;
};

/** Rappel aux détenteurs uniquement — jamais au locataire. */
export async function sendRentReminderEmail(payload: RentReminderEmailPayload) {
  assertMailReady();
  const subject = `Rappel : confirmer le loyer — ${payload.propertyLabel}`;
  const text = [
    `Bonjour,`,
    ``,
    `Le loyer de ${payload.tenantName} pour ${payload.periodLabel} (${payload.amountLabel})`,
    `sur le bien ${payload.propertyLabel} n’a pas encore été confirmé dans Locagest.`,
    ``,
    `Dès réception du virement, ouvre l’onglet Quittances et clique sur « Confirmer le paiement ».`,
    `La quittance sera alors envoyée au locataire.`,
    ``,
    `— Locagest`,
  ].join("\n");

  const html = `
    <p>Bonjour,</p>
    <p>Le loyer de <strong>${escapeHtml(payload.tenantName)}</strong> pour
    <strong>${escapeHtml(payload.periodLabel)}</strong>
    (<strong>${escapeHtml(payload.amountLabel)}</strong>)
    sur le bien <strong>${escapeHtml(payload.propertyLabel)}</strong>
    n’a pas encore été confirmé dans Locagest.</p>
    <p>Dès réception du virement, ouvre l’onglet <strong>Quittances</strong> et clique sur
    <strong>Confirmer le paiement</strong>. La quittance sera alors envoyée au locataire.</p>
    <p>— Locagest</p>
  `;

  await createTransport().sendMail({
    from: mailFrom(),
    to: payload.to,
    subject,
    text,
    html,
  });
}

export type QuittanceEmailPayload = {
  to: string;
  tenantName: string;
  propertyLabel: string;
  periodLabel: string;
  amountLabel: string;
  pdfBytes: Uint8Array;
  pdfFileName: string;
};

/** Quittance au locataire uniquement — PDF joint, aucun lien app. */
export async function sendQuittanceEmail(payload: QuittanceEmailPayload) {
  assertMailReady();
  const subject = `Quittance de loyer — ${payload.periodLabel}`;
  const text = [
    `Bonjour ${payload.tenantName},`,
    ``,
    `Veuillez trouver ci-joint votre quittance de loyer pour ${payload.periodLabel}`,
    `(${payload.amountLabel}) concernant le logement ${payload.propertyLabel}.`,
    ``,
    `— Locagest`,
  ].join("\n");

  const html = `
    <p>Bonjour ${escapeHtml(payload.tenantName)},</p>
    <p>Veuillez trouver <strong>ci-joint</strong> votre quittance de loyer pour
    <strong>${escapeHtml(payload.periodLabel)}</strong>
    (<strong>${escapeHtml(payload.amountLabel)}</strong>)
    concernant le logement <strong>${escapeHtml(payload.propertyLabel)}</strong>.</p>
    <p>— Locagest</p>
  `;

  await createTransport().sendMail({
    from: mailFrom(),
    to: payload.to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: payload.pdfFileName,
        content: Buffer.from(payload.pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });
}

export type QuittanceSentOwnerEmailPayload = {
  to: string;
  propertyLabel: string;
  tenantName: string;
  periodLabel: string;
  amountLabel: string;
  tenantEmail: string;
};

/** Accusé d’envoi aux détenteurs — jamais au locataire. */
export async function sendQuittanceSentOwnerEmail(payload: QuittanceSentOwnerEmailPayload) {
  assertMailReady();
  const subject = `Quittance envoyée — ${payload.propertyLabel}`;
  const text = [
    `Bonjour,`,
    ``,
    `La quittance de loyer pour ${payload.tenantName} (${payload.periodLabel}, ${payload.amountLabel})`,
    `concernant ${payload.propertyLabel} a bien été envoyée par e-mail à ${payload.tenantEmail}.`,
    ``,
    `— Locagest`,
  ].join("\n");

  const html = `
    <p>Bonjour,</p>
    <p>La quittance de loyer pour <strong>${escapeHtml(payload.tenantName)}</strong>
    (<strong>${escapeHtml(payload.periodLabel)}</strong>,
    <strong>${escapeHtml(payload.amountLabel)}</strong>)
    concernant <strong>${escapeHtml(payload.propertyLabel)}</strong>
    a bien été envoyée par e-mail à <strong>${escapeHtml(payload.tenantEmail)}</strong>.</p>
    <p>— Locagest</p>
  `;

  await createTransport().sendMail({
    from: mailFrom(),
    to: payload.to,
    subject,
    text,
    html,
  });
}
