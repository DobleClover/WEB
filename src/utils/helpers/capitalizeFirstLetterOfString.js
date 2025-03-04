export default function capitalizeFirstLetterOfEachWord(string,boolean) {
    // Divide la cadena en palabras usando el espacio como separador
    const words = string.split(" ");
    // Capitaliza la primera letra de cada palabra y convierte el resto a minúsculas
    const capitalizedWords = words.map(word => {
        if(boolean){
            //ACa quiere que todo el resto este en minuscula
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        } 
        return word.charAt(0).toUpperCase() + word.slice(1); //Aca lo mantengo igual
    });

    // Une las palabras capitalizadas en una sola cadena
    return capitalizedWords.join(" ").trim();
}
