export function getDateString(date, withTime = false) {
    if(!date)return
    const orderDate = new Date(date);
    const locale = "es-ES"; // Idioma español
  
    // Opciones de formato de fecha
    let options = { day: "numeric", month: "long", year: "numeric" };
  
    // Si withTime es true, agregamos horas y minutos
    if (withTime) {
      options = { ...options, hour: "2-digit", minute: "2-digit" };
    }
  
    return orderDate.toLocaleDateString(locale, options);
  }
  