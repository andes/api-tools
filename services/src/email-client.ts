import { ETL } from '@andes/etl';
import * as nodemailer from 'nodemailer';

export function EmailClient(etl: ETL, config: any, datos: any) {

    const data = etl.transform(datos, config);

    const transporter = nodemailer.createTransport(data.server);

    const mailOptions = {
        from: data.from,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
        attachments: data.attachments
    };

    return transporter.sendMail(mailOptions);
}
/*
{
    name: 'sisa-get-ciudadano',
    type: 'email-client',
    configuration: {
        servidor: {
            host: '',
            port: ''
        }
        from '',
        to: '',
        subject: '',
        html: '',
        attachments: '',
    }
};
*/
