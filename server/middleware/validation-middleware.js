import AppError from "../utils/app-error.js";

export const validate = (schema) => {
  return (req, res, next) => {
    // Validasi body
    const { error: bodyError } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (bodyError) {
      const messages = bodyError.details.map((err) => err.message).join(", ");
      return next(new AppError(400, "Validasi gagal, " + messages));
    }

    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((err) => err.message).join(", ");
      return next(new AppError(400, "Validasi parameter gagal, " + messages));
    }
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((err) => err.message).join(", ");
      return next(new AppError(400, "Validasi query gagal, " + messages));
    }
    next();
  };
};
