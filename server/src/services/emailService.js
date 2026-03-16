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

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `[Controle Financeiro] - ${userName || "Responsavel"} - ${monthLabel}`,
    text: `Segue em anexo o arquivo ${extensionLabel} do controle financeiro referente a ${monthLabel}.`,
    attachments: [
      {
        filename,
        content: attachmentBuffer,
        contentType
      },
      ...extraAttachments
    ]
  });
};
