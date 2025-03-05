export default{
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail
    pass: process.env.EMAIL_PASSWORD, // Contraseña de aplicación generada
  },
}