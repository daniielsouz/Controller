import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype?.startsWith("image/")) {
      callback(new Error("Envie apenas arquivos de imagem para o comprovante."));
      return;
    }

    callback(null, true);
  }
});
