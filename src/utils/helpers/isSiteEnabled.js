export default function isSiteEnabled() {
    const now = new Date();
  
    // Convertir a horario ARG (UTC-3)
    const nowInARG = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  
    // Buscar el jueves más próximo a las 20:00 (8 PM)
    const thursday20 = new Date(nowInARG);
    thursday20.setHours(20, 0, 0, 0);
  
    // Ajustar al jueves de esta semana
    const day = nowInARG.getDay(); // 0 = domingo ... 4 = jueves
    const diffToThursday = 4 - day; // cuántos días faltan
    thursday20.setDate(nowInARG.getDate() + diffToThursday);
  
    return nowInARG >= thursday20;
  }
  