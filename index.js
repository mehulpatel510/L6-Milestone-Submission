const app = require("./app");

var PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Started express server at port " + PORT);
});
