import { mailer } from "../config/mailer.js";

const CATEGORY_LABELS = {
  depositos: "Depositos",
  veiculos: "Despesas com veiculo",
  "outras-despesas": "Outras despesas"
};

const sortAttachmentsByDate = (attachments) =>
  [...attachments].sort((left, right) => {
    const leftDate = new Date(`${left.purchaseDate || "1970-01-01"}T00:00:00`).getTime();
    const rightDate = new Date(`${right.purchaseDate || "1970-01-01"}T00:00:00`).getTime();

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return String(left.filename || "").localeCompare(String(right.filename || ""), "pt-BR");
  });

const groupRemoteReceiptLinks = (attachments) => {
  const grouped = new Map();

  for (const attachment of sortAttachmentsByDate(attachments)) {
    const category = attachment.category || "outras-despesas";

    if (!grouped.has(category)) {
      grouped.set(category, []);
    }

    grouped.get(category).push(attachment);
  }

  return [...grouped.entries()];
};

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
    ? `\n\nComprovantes para consulta:\nCada link segue o padrao: Data - numero da nota - descricao.\n${groupRemoteReceiptLinks(remoteReceiptLinks)
        .map(
          ([category, attachments]) =>
            `${CATEGORY_LABELS[category] || category}:\n${attachments
              .map((attachment) => `- ${attachment.filename}: ${attachment.href}`)
              .join("\n")}`
        )
        .join("\n\n")}`
    : "";
  const remoteLinksHtml = remoteReceiptLinks.length
    ? `<p><strong>Comprovantes para consulta:</strong></p><p>Cada link segue o padrao: Data - numero da nota - descricao.</p>${groupRemoteReceiptLinks(
        remoteReceiptLinks
      )
        .map(
          ([category, attachments]) =>
            `<p><strong>${CATEGORY_LABELS[category] || category}</strong></p><ul>${attachments
              .map(
                (attachment) =>
                  `<li><a href="${attachment.href}">${attachment.filename}</a></li>`
              )
              .join("")}</ul>`
        )
        .join("")}`
    : "";

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `[Controle Financeiro] - ${userName || "Responsavel"} - ${monthLabel}`,
    text: `Segue em anexo o arquivo ${extensionLabel} do controle financeiro referente a ${monthLabel}.${remoteLinksText}\n\nATENCAO: as imagens das notas ficam salvas por 60 dias e sao apagadas automaticamente no dia 1º de cada mes.`,
    html: `<p>Segue em anexo o arquivo <strong>${extensionLabel}</strong> do controle financeiro referente a <strong>${monthLabel}</strong>.</p>${remoteLinksHtml}<p><strong>ATENCAO:</strong> as imagens das notas ficam salvas por 60 dias e sao apagadas automaticamente no dia 1º de cada mes.</p>`,
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
