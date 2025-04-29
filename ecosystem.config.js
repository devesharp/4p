module.exports = {
  apps: [{
    name: 'p4-payments',
    script: './node_modules/.bin/ts-node',
    args: '-T server.ts',
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