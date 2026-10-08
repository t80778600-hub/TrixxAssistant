export function setupDashboard(app, bot) {
  app.get('/dashboard', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TitanBot Dashboard</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #0f1115;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }

          .container {
            text-align: center;
            background: #181b21;
            padding: 40px;
            border-radius: 12px;
            width: 400px;
          }

          h1 {
            margin-bottom: 10px;
          }

          p {
            color: #a0a0a0;
          }

          .status {
            margin-top: 25px;
            padding: 15px;
            background: #22262e;
            border-radius: 8px;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <h1>TitanBot Dashboard</h1>

          <p>Manage your Discord server and TitanBot.</p>

          <div class="status">
            Bot Status: Online
          </div>
        </div>
      </body>
      </html>
    `);
  });
}
