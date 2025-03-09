export default function generateHexCode(length = 8) {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 16).toString(16); // Hexadecimal (0-9, a-f)
    }
    return code;
}