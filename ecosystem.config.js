module.exports = {
  apps: [{
    name: "dtu-socket-server",
    script: "./src/server.js",
    watch: true,
    env: {
      "NODE_ENV": "development",
    },
    env_production: {
      "NODE_ENV": "production"
    },
    instances: "max",
    exec_mode: "cluster",
    autorestart: true,
    max_memory_restart: "1G",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    merge_logs: true,
    log_type: "json"
  }]
} 