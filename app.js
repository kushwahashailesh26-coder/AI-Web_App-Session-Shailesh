const express = require("express");
const app = express();
const PORT = 3000;

// GET / — App Page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>App Page</title></head>
      <body>
        <h1>Welcome to the App Page!</h1>
        <p>This is the home route.</p>
      </body>
    </html>
  `);
});

// GET /hello — Hello Page
app.get("/hello", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Hello Page</title></head>
      <body>
        <h1>Hello, World!</h1>
        <p>You hit the /hello route.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
