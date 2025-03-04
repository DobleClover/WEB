export default function (number) {
    if(!number)return null;
  // Convert the number to a string
  const numberString = number.toString();

  // Check if the number has decimals
  if (numberString.includes(".")) {
    // Remove unnecessary zeros at the end of the decimal part
    const decimalsWithoutZeros = numberString.replace(/\.?0+$/, "");
    // If there are no decimals left, remove the decimal point
    return decimalsWithoutZeros.replace(/\.$/, "");
  } else {
    // If the number has no decimals, simply return the number as it is
    return numberString;
  }
}
