import { mailer } from "../config/mailer.js";

export const sendMonthlyReportEmail = async ({
  to,
  attachmentBuffer,
  filename,
  monthLabel,
  userName,
  contentType,
  extensionLabel,
  extraAttachments = []
}) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      "SMTP nao configurado. Preencha SMTP_USER e SMTP_PASS no arquivo server/.env."
    );
  }

  const fileAttachments = extraAttachments.filter(
    (attachment) => attachment.attachmentType !== "remote-link"
  );
  const remoteReceiptLinks = extraAttachments.filter(
    (attachment) => attachment.attachmentType === "remote-link"
  );
  const remoteLinksText = remoteReceiptLinks.length
    ? `\n\nComprovantes para consulta:\n${remoteReceiptLinks
        .map((attachment) => `- ${attachment.filename}: ${attachment.href}`)
        .join("\n")}`
    : "";
  const remoteLinksHtml = remoteReceiptLinks.length
    ? `<p><strong>Comprovantes para consulta:</strong></p><ul>${remoteReceiptLinks
        .map(
          (attachment) =>
            `<li><a href="${attachment.href}">${attachment.filename}</a></li>`
        )
        .join("")}</ul>`
    : "";

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `[Controle Financeiro] - ${userName || "Responsavel"} - ${monthLabel}`,
    text: `Segue em anexo o arquivo ${extensionLabel} do controle financeiro referente a ${monthLabel}.${remoteLinksText}`,
    html: `<p>Segue em anexo o arquivo <strong>${extensionLabel}</strong> do controle financeiro referente a <strong>${monthLabel}</strong>.</p>${remoteLinksHtml}`,
    attachments: [
      {
        filename,
        content: attachmentBuffer,
        contentType
      },
      ...fileAttachments
    ]
  });
};
