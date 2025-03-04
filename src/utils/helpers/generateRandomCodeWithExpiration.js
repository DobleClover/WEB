export default function () {
    const length = 6;
    const chars = '123456789';
    const expirationMinutes = 30; // Tiempo de expiración en minutos
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + expirationMinutes * 60 * 1000); // Calcula la fecha de expiración
  
    let verificationCode = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      verificationCode += chars.charAt(randomIndex);
    }
  
    return {
      verificationCode,
      expirationTime
    };
}