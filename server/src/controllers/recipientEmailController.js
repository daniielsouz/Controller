import { RecipientEmail } from "../models/index.js";

export const listRecipientEmails = async (req, res) => {
  const recipients = await RecipientEmail.findAll({
    where: { userId: req.user.id },
    order: [["label", "ASC"]]
  });

  return res.json(
    recipients.map((recipient) => ({
      id: recipient.id,
      label: recipient.label,
      email: recipient.email
    }))
  );
};

export const createRecipientEmail = async (req, res) => {
  const { label, email } = req.body;

  const existingRecipient = await RecipientEmail.findOne({
    where: {
      userId: req.user.id,
      email
    }
  });

  if (existingRecipient) {
    return res.status(409).json({ message: "Este e-mail de destino ja foi salvo." });
  }

  const recipient = await RecipientEmail.create({
    userId: req.user.id,
    label: label?.trim() || email,
    email: email.trim()
  });

  return res.status(201).json({
    id: recipient.id,
    label: recipient.label,
    email: recipient.email
  });
};

export const deleteRecipientEmail = async (req, res) => {
  const recipient = await RecipientEmail.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!recipient) {
    return res.status(404).json({ message: "E-mail de destino nao encontrado." });
  }

  await recipient.destroy();

  return res.json({ message: "E-mail de destino removido com sucesso." });
};
