module.exports = {
  apps: [{
    name: 'p4-payments',
    script: 'yarn',
    args: 'dev',
    watch: false,
    max_memory_restart: '1G',
    autorestart: true,
    restart_delay: 3000,
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    }
  }]
}; 