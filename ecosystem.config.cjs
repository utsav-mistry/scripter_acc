module.exports = {
  apps: [
    {
      name: 'pm-suite-api',
      script: './server/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      }
    }
  ]
};
