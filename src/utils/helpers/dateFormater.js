export default function (date,longDate) {
    date = new Date(date);
    
    const options = { day: longDate ? '2-digit' : 'numeric', month:  longDate ? '2-digit' : 'numeric', year: 'numeric', timeZone: 'UTC' };
    const formattedDate = date.toLocaleDateString('es-ES', options);

    
    return formattedDate;
}