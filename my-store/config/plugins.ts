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
    upload: {
        config: {
            breakpoints: {
                xlarge: 1920,
                large: 1000,
                medium: 750,
                small: 500,
                xsmall: 64,
            },
            sizeLimit: 10 * 1024 * 1024, // 10MB
            // Disable responsive images on Windows (causes EPERM temp file errors)
            responsiveDimensions: false,
        },
    },
});

