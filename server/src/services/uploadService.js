import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

const uploadToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(fileBuffer);
  });

export const uploadReceipt = async (file) => {
  if (!file) {
    return null;
  }

  if (hasCloudinaryConfig) {
    return uploadToCloudinary(file.buffer, "controller-financeiro/receipts");
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  const extension = path.extname(file.originalname) || ".jpg";
  const filename = `${randomUUID()}${extension}`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: filename
  };
};

export const deleteReceipt = async ({ receiptUrl, receiptPublicId }) => {
  if (!receiptUrl && !receiptPublicId) {
    return;
  }

  if (hasCloudinaryConfig && receiptPublicId) {
    await cloudinary.uploader.destroy(receiptPublicId).catch(() => null);
    return;
  }

  if (receiptUrl?.startsWith("/uploads/")) {
    const filepath = path.resolve(uploadsDir, receiptUrl.replace("/uploads/", ""));
    await fs.unlink(filepath).catch(() => null);
  }
};

const sanitizeFilename = (value) =>
  String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);

const formatDateForFilename = (value) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) {
    return sanitizeFilename(value);
  }

  return `${day}-${month}-${year}`;
};

const formatCategoryLabel = (value) => {
  if (value === "depositos") {
    return "depositos";
  }

  if (value === "veiculos") {
    return "veiculos";
  }

  if (value === "outras-despesas") {
    return "outras-despesas";
  }

  return sanitizeFilename(value);
};

const extractExtension = (transaction) => {
  const candidates = [transaction.receiptUrl, transaction.receiptPublicId].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.startsWith?.("http://") || candidate.startsWith?.("https://")) {
      try {
        const extension = path.extname(new URL(candidate).pathname);
        if (extension) {
          return extension;
        }
      } catch (_error) {
        // Ignore malformed URLs and keep searching.
      }
    }

    const extension = path.extname(candidate);
    if (extension) {
      return extension;
    }
  }

  return ".jpg";
};

export const buildReceiptEmailAttachments = (transactions = []) => {
  const usedNames = new Set();

  return transactions
    .filter((transaction) => transaction.receiptUrl)
    .map((transaction) => {
      const extension = extractExtension(transaction);
      const datePart = formatDateForFilename(transaction.purchaseDate);
      const invoicePart = sanitizeFilename(transaction.invoiceNumber) || `sem-nota-${transaction.id}`;
      const categoryPart = formatCategoryLabel(transaction.category) || "sem-categoria";
      const baseName = [datePart, invoicePart, categoryPart].filter(Boolean).join(" - ");

      let filename = `${baseName}${extension}`;
      let suffix = 2;

      while (usedNames.has(filename.toLowerCase())) {
        filename = `${baseName}-${suffix}${extension}`;
        suffix += 1;
      }

      usedNames.add(filename.toLowerCase());

      if (transaction.receiptUrl.startsWith("/uploads/")) {
        return {
          filename,
          path: path.resolve(uploadsDir, transaction.receiptUrl.replace("/uploads/", ""))
        };
      }

      return {
        filename,
        href: transaction.receiptUrl
      };
    });
};
