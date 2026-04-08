export default {
    routes: [
        {
            method: 'POST',
            path: '/visitors/ping',
            handler: 'visitor.ping',
            config: {
                auth: false, // Public so frontend can ping without login
            },
        },
        {
            method: 'GET',
            path: '/visitors',
            handler: 'visitor.find',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/visitors/:id',
            handler: 'visitor.findOne',
            config: {
                auth: false,
            },
        }
    ],
};
