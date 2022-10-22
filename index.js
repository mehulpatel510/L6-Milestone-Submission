const app = require("./app");

var PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Started express server at port 3000");
});
