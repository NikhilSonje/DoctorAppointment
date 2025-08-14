const express = require("express");
const config = require("./config/config.json");
const app = express();

const indexRouter = require("./routes/index");
// Middleware Part
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", indexRouter);

const port = process.env.PORT || config.server.port;
const getUrlPrefix = config.app.prefix;
app.listen(port, () => {
  console.log("API is running on port", port);
  console.log(`Try this URL: http://localhost:${port}${getUrlPrefix}/ping`);
});

module.exports = app;