import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");
const COMPRESSED_IMAGE_EXTENSION = ".jpg";

const isImageMimeType = (mimeType) => mimeType?.startsWith("image/");
const getResourceType = (mimeType) => (isImageMimeType(mimeType) ? "image" : "raw");

const compressReceiptImage = async (file) => {
  const compressedBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({
      quality: 72,
      mozjpeg: true
    })
    .toBuffer();

  return {
    buffer: compressedBuffer,
    extension: COMPRESSED_IMAGE_EXTENSION
  };
};

const getExtensionFromFilename = (file) => {
  const extracted = path.extname(file.originalname || "");
  return extracted || ".pdf";
};

const prepareReceiptFile = async (file) => {
  if (isImageMimeType(file.mimetype)) {
    return compressReceiptImage(file);
  }

  return {
    buffer: file.buffer,
    extension: getExtensionFromFilename(file)
  };
};

const uploadToCloudinary = (fileBuffer, folder, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, ...options },
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

  const { buffer, extension } = await prepareReceiptFile(file);
  const mimeType = file.mimetype;
  const resourceType = getResourceType(mimeType);
  const format = resourceType === "image" ? "jpg" : extension.replace(".", "") || "pdf";

  if (hasCloudinaryConfig) {
    const result = await uploadToCloudinary(buffer, "controller-financeiro/receipts", {
      resource_type: resourceType,
      format,
      type: "upload"
    });

    return {
      ...result,
      mimeType,
      resourceType
    };
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${randomUUID()}${extension}`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, buffer);

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
      const descriptionPart = sanitizeFilename(transaction.description) || "sem-descricao";
      const baseName = [datePart, invoicePart, descriptionPart].filter(Boolean).join(" - ");

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
          path: path.resolve(uploadsDir, transaction.receiptUrl.replace("/uploads/", "")),
          attachmentType: "local",
          category: transaction.category,
          purchaseDate: transaction.purchaseDate
        };
      }

      return {
        filename,
        href: transaction.receiptUrl,
        attachmentType: "remote-link",
        category: transaction.category,
        purchaseDate: transaction.purchaseDate
      };
    });
};
