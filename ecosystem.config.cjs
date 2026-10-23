module.exports = {
  apps: [
    {
      name: "tabi-server",
      script: "dist/server/index.js",
      // Run from server/ so --env-file-if-exists picks up server/.env.
      cwd: `${__dirname}/server`,
      node_args: "--env-file-if-exists=.env",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "256M",
      exp_backoff_restart_delay: 100,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: `${__dirname}/logs/server-error.log`,
      out_file: `${__dirname}/logs/server-out.log`,
      merge_logs: true,
    },
  ],
};
