export default {
  routes: [
    {
      method: 'POST',
      path: '/user-upload',
      handler: 'user-upload.upload',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
