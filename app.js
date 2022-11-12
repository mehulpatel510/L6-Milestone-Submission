const express = require("express");
var csrf = require("tiny-csrf")
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

// const { fileURLToPath } = require ("url"); // the node package 'url'

// function dirname(meta) {
//     return fileURLToPath(meta.url);
// }

// // call with import.meta
// const __dirname = dirname(meta);

//const path = require("path")
//app.use(express.static(path.join(__dirname,"public")));


app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));

app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  const allTodos = await Todo.getTodos();
  const overdueTodos = await Todo.getOverdueTodos();
  const dueTodayTodos = await Todo.getDueTodayTodos();
  const dueLaterTodos = await Todo.getDueLaterTodos();
  const completedItems = await Todo.getCompletedItems();

  if (request.accepts("html")) {
    response.render("index", {
      title: "Todos List",
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  }
  else {
    response.json({ allTodos });
  }
});


app.get("/todos", async function (request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  const todos = await Todo.findAll();
  //console.log(todos);

  // return response.json(todos);
  // Then, we have to respond with all Todos, like:
  response.send(todos)
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  // Create a todo
  try {
    const todo = await Todo.addTodo(request.body);
    // console.log("Accept:-" + request.accepts("json"));
    // console.log("Accept:-" + request.accepts("html"));

    if (request.accepts("html")) {
      // console.log("HTML response:" + response.text)
      return response.redirect("/");
    }
    else {
      return response.json(todo);
    }

  } catch (error) {
    console.log("Error at post:" + error);
    return response.status(422).json(error);
  }
});

// app.put("/todos/:id/markAsCompleted", async function (request, response) {
app.put("/todos/:id", async function (request, response) {
  console.log("Testing:::::::::" + request.params.id + " --- " + request.body.completed);
  const todo = await Todo.findByPk(request.params.id);
  try {
    //const updatedTodo = await todo.markAsCompleted();
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);

  } catch (error) {
    console.log("PUT Request:" + error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // First, we have to query our database to delete a Todo by ID.
  const todo = await Todo.findByPk(request.params.id);
  try {
    // console.log(todo);
    if (todo == null)
      return response.send(false);

    todo.deleteTodo();
    return response.send(true);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }

});

module.exports = app;
