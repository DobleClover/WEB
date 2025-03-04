export const HTTP_STATUS = {
  // 2xx - Respuestas exitosas
  OK: { code: 200, message: { en: "Success", es: "Éxito" } },
  CREATED: {
    code: 201,
    message: {
      en: "Resource created successfully",
      es: "Recurso creado exitosamente",
    },
  },
  NO_CONTENT: { code: 204, message: { en: "No content", es: "Sin contenido" } },

  // 4xx - Errores del cliente
  BAD_REQUEST: {
    code: 400,
    message: { en: "Bad request", es: "Solicitud incorrecta" },
  },
  UNAUTHORIZED: {
    code: 401,
    message: {
      en: "Unauthorized, authentication required",
      es: "No autorizado, autenticación requerida",
    },
  },
  FORBIDDEN: {
    code: 403,
    message: {
      en: "Forbidden, you do not have permission",
      es: "Prohibido, no tienes permiso",
    },
  },
  NOT_FOUND: {
    code: 404,
    message: { en: "Resource not found", es: "Recurso no encontrado" },
  },
  METHOD_NOT_ALLOWED: {
    code: 405,
    message: { en: "Method not allowed", es: "Método no permitido" },
  },
  CONFLICT: {
    code: 409,
    message: {
      en: "Conflict with the current state of the resource",
      es: "Conflicto con el estado actual del recurso",
    },
  },
  TOO_MANY_REQUESTS: {
    code: 429,
    message: {
      en: "Too many requests, slow down",
      es: "Demasiadas solicitudes, por favor reduzca la velocidad",
    },
  },

  // 5xx - Errores del servidor
  INTERNAL_SERVER_ERROR: {
    code: 500,
    message: { en: "Internal server error", es: "Error interno del servidor" },
  },
  NOT_IMPLEMENTED: {
    code: 501,
    message: { en: "Not implemented", es: "No implementado" },
  },
  BAD_GATEWAY: {
    code: 502,
    message: { en: "Bad gateway", es: "Puerta de enlace incorrecta" },
  },
  SERVICE_UNAVAILABLE: {
    code: 503,
    message: {
      en: "Service temporarily unavailable",
      es: "Servicio temporalmente no disponible",
    },
  },
  GATEWAY_TIMEOUT: {
    code: 504,
    message: {
      en: "Gateway timeout",
      es: "Tiempo de espera agotado en la puerta de enlace",
    },
  },
};
