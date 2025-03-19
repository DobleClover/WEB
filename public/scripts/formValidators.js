export function validateUserSignUpForm(form){
    const errorsContainer = form.querySelector('.ui.error.message');
    let passwordElement = form.querySelector('input[name="user-password"]');
    let rePasswordElement = form.querySelector('input[name="user-re-password"]');
    if(!validateString(passwordElement?.value)){
        let passwordField =  passwordElement.closest('.field');
        passwordField.classList.add('error');
        rePasswordElement.value = '';
        errorsContainer.innerHTML = `<p>La contraseña debe cumplir con los requisitos.</p>`;
        form.classList.add('error')
        return false
    };
    //Aca tiene que coincidir password y rePassword
    
    if(rePasswordElement?.value != passwordElement.value){
        let rePasswordElementField = rePasswordElement.closest('.field'); 
        rePasswordElementField.classList.add('error');
        errorsContainer.innerHTML = `<p>Las contraseñas deben coincidir.</p>`;
        form.classList.add('error')
        return false
    };

    //Aca dio ok, retorno true
    return true;
}

export default function validateString(input) {
    // Verifica si el string tiene al menos 8 caracteres
    if (input.length < 8) return false;

    // Verifica si contiene al menos una letra mayúscula
    if (!/[A-Z]/.test(input)) return false;

    // Si pasa ambas validaciones, retorna true
    return true;
}