/* eslint-disable no-undef */
const request = require("supertest");
const csrf = require("tiny-csrf")
const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
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



  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);

  });

  test("Marks a todo with the given ID as complete", async () => {

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
    console.log("Todo ID:" + todoID+"---");
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

  // test("Fetches all todos in the database using /todos endpoint", async () => {
  //   const responseExisting = await agent.get("/todos");
  //   const parsedResponseExisting = JSON.parse(responseExisting.text);

  //   await agent.post("/todos").send({
  //     title: "Buy xbox",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   await agent.post("/todos").send({
  //     title: "Buy ps3",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const response = await agent.get("/todos");
  //   const parsedResponse = JSON.parse(response.text);

  //   expect(parsedResponse.length).toBe(parsedResponseExisting.length + 2);
  //   // expect(parsedResponse[parsedResponseExisting.length + 2 ]["title"]).toBe("Buy ps3");
  // });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
   
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
    console.log("Todo ID:" + todoID+"---");
    expect(parsedResponse.completed).toBe(false);

    res = await agent.set('Accept', 'text/html').get("/");
    // console.log("Res:---"+ (res.text));
    csrfToken = extractCsrfToken(res);
    console.log("CSRF Token2:" + csrfToken);
     

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
});
