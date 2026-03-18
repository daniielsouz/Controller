const toSerializableObject = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value).reduce((accumulator, [key, entry]) => {
    if (entry !== undefined) {
      accumulator[key] = entry;
    }

    return accumulator;
  }, {});
};

const classifyError = (error) => {
  const candidates = [error, error?.original, error?.parent].filter(Boolean);

  for (const candidate of candidates) {
    switch (candidate.code) {
      case "ENOTFOUND":
        return "database_host_not_found";
      case "ECONNREFUSED":
        return "database_connection_refused";
      case "ETIMEDOUT":
        return "network_timeout";
      case "ER_ACCESS_DENIED_ERROR":
        return "database_access_denied";
      default:
        break;
    }

    if (candidate.name === "SequelizeConnectionError") {
      return "database_connection_error";
    }

    if (candidate.name === "SequelizeHostNotFoundError") {
      return "database_host_not_found";
    }

    if (candidate.name === "SequelizeAccessDeniedError") {
      return "database_access_denied";
    }
  }

  return "unexpected_error";
};

export const formatErrorDetails = (error, extra = {}) => {
  const subject = error?.original || error?.parent || error;

  return toSerializableObject({
    type: classifyError(error),
    name: error?.name,
    message: error?.message,
    code: subject?.code,
    errno: subject?.errno,
    syscall: subject?.syscall,
    hostname: subject?.hostname,
    stack: error?.stack,
    ...extra
  });
};

export const logInfo = (scope, message, details = {}) => {
  console.log(`[${scope}] ${message}`, toSerializableObject(details));
};

export const logError = (scope, message, error, details = {}) => {
  console.error(`[${scope}] ${message}`, formatErrorDetails(error, details));
};
