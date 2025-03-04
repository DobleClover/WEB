export default {
    host: process.env.EMAIL_HOST, // Cambia esto por el servidor SMTP de tu host
    port: process.env.EMAIL_PORT, // Puerto SMTP (generalmente 587 o 465)
    secure: true, // Usar TLS o SSL (true para 465, false para 587)
    auth: {
      user: process.env.EMAIL_USER, // Tu dirección de correo electrónico
      pass: process.env.EMAIL_PASSWORD, // Tu contraseña de correo electrónico
    },
  };