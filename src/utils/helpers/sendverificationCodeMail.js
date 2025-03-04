// import nodemailer from 'nodemailer';
import emailConfig from '../staticDB/mailConfig.js';
import nodemailer from 'nodemailer'
async function sendVerificationCodeMail(code,userEmail) {
    code = code.split('');//Lo armo array
    // Configuración del transporte del correo
    // const transporter = nodemailer.createTransport(emailConfig);
    let transporter = nodemailer.createTransport(emailConfig);
    // Contenido del correo
    let userMailContent = {
        es: `
    <div style="display:flex;flenpm i nodemailerx-direction:column;width:100%;align-items-center;">
        <p>Estimado usuario,</p>
        <p>Gracias por registrarte, su codigo de verificación es: </p>
        <div class="code-container" style="display:flex;width:40%;justify-content: space-between;">
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[0]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[1]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[2]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[3]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[4]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[5]}</p>
        </div>
        <p>(Expira en 30 minutos)</p>
    </div>
    `,
    en:`
    <div style="display:flex;flex-direction:column;width:100%;align-items-center;">
        <p>Dear User,</p>
        <p>Thanks for registering, your verification code is: </p>
        <div class="code-container" style="display:flex;width:40%;justify-content: space-between;">
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[0]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[1]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[2]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[3]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[4]}</p>
            <p style="border: 1px solid; width: fit-content; padding: 10px; ">${code[5]}</p>
        </div>
        <p>(Expires in 30 minutes)</p>
    </div>
    `,
    }
    let subject = {
        es: 'Codigo de Verificación',
        en: 'Verification Code'
    }
    // Opciones del correo
    const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: subject.es,
        html: userMailContent.es
    };
    try {
        // Envío de los correos
        const userMail = await transporter.sendMail(userMailOptions);
        console.log('Correos enviados:', userMail.messageId);
        return true;
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        return false
    }
};

export default sendVerificationCodeMail