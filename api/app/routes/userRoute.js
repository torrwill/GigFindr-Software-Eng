module.exports = app => {
    const users = require("../controllers/controller.js");
  
    var router = require("express").Router();
  
    // Retrieve all Users
    router.get("/", users.findAll);

    // Retrieve a single user
    router.get("/:id", users.findOne)

    app.use('/api/users', router);
};