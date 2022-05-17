module.exports = {
  apps: [
    {
      name: 'GanttPlaneamento',
      script: "./dist/server.js",
      watch: false,
      log: 'ganntplan.log',
      exec_mode: 'fork',
      max_memory_restart: '1G',
      restart_delay: 5000,
    }
  ],
};


// pm2 start --name https_server --watch true ts-node-dev -- -P tsconfig.json ./server.ts
// pm2 start --name https_server --watch true -p ts-node-dev ./server.ts
