const express = require("express");
const flash = require("connect-flash");
var csrf = require("tiny-csrf")
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const path = require("path");
//const __dirname = path.resolve();
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));
app.use(flash());



app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.use(express.static("public"));

app.use(session({
  resave: false,//added 
  saveUninitialized: true,//added 
  secret: "my-super-secret-key-123123123123",
  cookie: {
    maxAge: 24 * 60 * 60 * 100
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  console.log("Authentication for " + username)
  User.findOne({ where: { email: username } })
    .then(async (user) => {
      if (user) {
        console.log("Check password for " + user)
        const result = await bcrypt.compare(password, user.password);
        console.log(result)
        if (result) {
          console.log("Login Result:" + result)
          return done(null, user);
        }
        else {
          console.log("Invalid user");
          return done(null, false, { message: "Invalid Username/Password" });
        }
      }
      else {
        console.log("Invalid user");
        return done(null, false, { message: "Invalid Username/Password" });
      }
    })
    .catch((error) => {
      console.log("Fail email id: " + error)
      return (error)
    })
  console.log("Complete Authentication");
}
))

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch((error) => {
      done(error, null)
    })
})

app.set("view engine", "ejs");

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});



app.get("/home", (request, response) => {
  response.render("home");
});

app.get("/signup", (request, response) => {
  return response.render("signup", { csrfToken: request.csrfToken() });
});

app.get("/login", (request, response) => {
  response.render("login", { csrfToken: request.csrfToken() });
});

app.post("/session",
  passport.authenticate('local', {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/")
  });

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err)
      return next(err);
    else
      return response.redirect("/home");
  })
});
app.post("/users", async (request, response) => {
  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
  try {
    console.log("Going to create new user")

    //const newUser = 
    User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPassword
    })
      .then(user => {
        request.login(user, (err) => {
          if (err) {
            console.log("Login Issue:" + err);
          }
        });
        console.log(user);
        response.redirect("/");
      })
      .catch(err => {
        console.log("Error at Sign up:" + err);
        //request.flash('error', err);
        err.errors.map(e => {
          console.log(e.message);
          request.flash('error', { message: e.message });
        });

        response.redirect("/signup");
        //throw err;
      });

  } catch (error) {
    console.log("Sign up Error at post:\n");

    //request.flash('error', { message: error.messages });
    //return response.redirect("/");
    response.redirect("/signup");
  }
});

app.get("/users", async (request, response) => {
  const allUsers = await User.getUsers();
  response.json({ allUsers });
})

app.get("/", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {

  const loggedUserId = request.user.id;
  const allTodos = await Todo.getTodos();
  const overdueTodos = await Todo.getOverdueTodos(loggedUserId);
  const dueTodayTodos = await Todo.getDueTodayTodos(loggedUserId);
  const dueLaterTodos = await Todo.getDueLaterTodos(loggedUserId);
  const completedItems = await Todo.getCompletedItems(loggedUserId);

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


app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  const todos = await Todo.findAll();
  //console.log(todos);

  // return response.json(todos);
  // Then, we have to respond with all Todos, like:
  response.send(todos)
});

app.get("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  // Create a todo
  try {
    const loggedUserId = request.user.id;
    console.log("Logged User:::" + loggedUserId);
    const todo = await Todo.addTodo(request.body, loggedUserId);
    // console.log("Accept:-" + request.accepts("json"));
    // console.log("Accept:-" + request.accepts("html"));
    console.log("Inserted Todos");
    if (request.accepts("html")) {
      // console.log("HTML response:" + response.text)

      console.log("Html Request");
      return response.redirect("/");
    }
    else {
      return response.json(todo);
    }

  } catch (error) {
    console.log("Error at post:" + error);
    request.flash('error', { message: error.message.split(":")[1] });
    return response.redirect("/");
  }
});

// app.put("/todos/:id/markAsCompleted", async function (request, response) {
app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("Testing:::::::::" + request.params.id + " --- " + request.body.completed);
  const todo = await Todo.findByPk(request.params.id);
  console.log("Todo:-" + todo.displayableString());
  try {
    //const updatedTodo = await todo.markAsCompleted();
    if (todo.userId == request.user.id) {
      const updatedTodo = await todo.setCompletionStatus(request.body.completed);
      return response.json(updatedTodo);
    }
    else {
      return {};
    }
  } catch (error) {
    console.log("PUT Request:" + error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // First, we have to query our database to delete a Todo by ID.
  const todo = await Todo.findByPk(request.params.id);
  try {
    // console.log(todo);
    if (todo == null)
      return response.send(false);
    if (todo.userId == request.user.id) {
      todo.deleteTodo();
      return response.send(true);
    }
    else {
      return response.send(false);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }

});

module.exports = app;
