/* eslint-disable no-undef */
const request = require("supertest");
//const csrf = require("tiny-csrf")
const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application Sign in", function () {
  let todoIDUserB;
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => { });
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  let login = async (agent, username, password) => {
    let res = await agent.get("/login");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: username,
      password: password,
      _csrf: csrfToken
    });


  }

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    console.log("CSRF Token - Sign up:" + csrfToken);
    res = await agent.post("/users").send({
      firstName: "Test A",
      lastName: "User A",
      email: "user.a@test.com",
      password: "123456",
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302);
  })

  test("Sign Out", async () => {
    let res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    console.log("CSRF Token - Sign out:" + csrfToken);
    res = await agent.get("/signout").send({
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302);
  })

  test("Sign up second user", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    console.log("CSRF Token - Sign up User B:" + csrfToken);
    res = await agent.post("/users").send({
      firstName: "Test B",
      lastName: "User B",
      email: "user.b@test.com",
      password: "123456",
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302);
  })

  

  test("Sign Out", async () => {
    let res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    console.log("CSRF Token - Sign out:" + csrfToken);
    res = await agent.get("/signout").send({
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302);
  })


  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");

    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    console.log("CSRF Token0:" + csrfToken);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);

  });

  test("Creates a todo by User B", async () => {

    const agent = request.agent(server);
    await login(agent, "user.b@test.com", "123456");


    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    console.log("CSRF Token1:" + csrfToken);
    const response = await agent
      .set('Accept', 'application/json')
      .post("/todos")
      .send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,

      });
    // console.log("Response Text:::" + response.text + ":::");
    const parsedResponse = JSON.parse(response.text);
    todoIDUserB = parsedResponse.id;
    console.log("Todo ID:" + todoIDUserB + "---");
    expect(parsedResponse.completed).toBe(false);

    // todoIDUserB = parsedResponse.id;
    // console.log("Todo ID for User B:" + todoIDUserB + "---");

    // expect(response.statusCode).toBe(302);

  });

  test("Marks a todo with the given ID as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");

    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    console.log("CSRF Token1:" + csrfToken);
    const response = await agent
      .set('Accept', 'application/json')
      .post("/todos")
      .send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,

      });
    // console.log("Response Text:::" + response.text + ":::");
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;
    console.log("Todo ID:" + todoID + "---");
    expect(parsedResponse.completed).toBe(false);

    res = await agent.set('Accept', 'text/html').get("/");
    // console.log("Res:---"+ (res.text));
    csrfToken = extractCsrfToken(res);
    console.log("CSRF Token2:" + csrfToken);


    const markCompleteResponse = await agent
      // .set('Accept', 'application/json')
      .put(`/todos/${todoID}`)
      .send({
        completed: true,
        _csrf: csrfToken,
      });
    console.log("Mark as completed response: " + markCompleteResponse.text);
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);

    expect(parsedUpdateResponse.completed).toBe(true);

  });

  test("Marks a todo with the given ID as complete by another user", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");

    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    console.log("CSRF Token1:" + csrfToken);


    const markCompleteResponse = await agent
      // .set('Accept', 'application/json')
      .put(`/todos/${todoIDUserB}`)
      .send({
        completed: true,
        _csrf: csrfToken,
      });
    console.log("Mark as completed response for another user: " + markCompleteResponse.text);
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);

    expect(parsedUpdateResponse.completed).toBe(false);

  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");

    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    console.log("CSRF Token1:" + csrfToken);

    const response = await agent
      .set('Accept', 'application/json')
      .post("/todos")
      .send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,

      });
    // console.log("Response Text:::" + response.text + ":::");
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;
    console.log("Todo ID for delete:" + todoID + "---");
    expect(parsedResponse.completed).toBe(false);

    res = await agent.set('Accept', 'text/html').get("/");
    csrfToken = extractCsrfToken(res);
    console.log("CSRF Token2:" + csrfToken);

    // test to delete by authenticated user
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      // .set('Accept', 'application/json')
      .delete(`/todos/${todoID}`)
      .send({
        _csrf: csrfToken,
      });
    console.log("Mark as completed response: " + deleteResponse.text);
    const parsedDeleteResponse = JSON.parse(deleteResponse.text);

    expect(parsedDeleteResponse).toBe(true);

  });


  test("Deletes a todo with the given ID by another user", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");

    // test to delete by unauthenticated user
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      // .set('Accept', 'application/json')
      .delete(`/todos/${todoIDUserB}`)
      .send({
        _csrf: csrfToken,
      });
    console.log("Mark as completed response: " + deleteResponse2.text);
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text);

    expect(parsedDeleteResponse2).toBe(false);



  });

});
