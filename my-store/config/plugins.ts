export default ({ env }) => ({
    email: {
        config: {
            provider: 'nodemailer',
            providerOptions: {
                host: env('SMTP_HOST', 'smtp.gmail.com'),
                port: env.int('SMTP_PORT', 587),
                auth: {
                    user: env('SMTP_USERNAME'),
                    pass: env('SMTP_PASSWORD'),
                },
            },
            settings: {
                defaultFrom: env('SMTP_FROM', 'no-reply@oussama-shoes.com'),
                defaultReplyTo: env('SMTP_REPLY_TO', 'contact@oussama-shoes.com'),
            },
        },
    },
});
