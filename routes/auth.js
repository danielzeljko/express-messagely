"use strict";

const Router = require("express").Router;
const router = new Router();
const User = require("../models/user");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const jwt = require("jsonwebtoken");


const { BadRequestError } = require("../expressError");

/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res, next) {
  if(req.body === undefined) throw new BadRequestError("Body must be included.");

  const { username, password } = req.body;
  const result = await User.authenticate(username, password);

  //update login timestamp
  if(result === true) {
    const payload = {username};
    const token = jwt.sign(payload, SECRET_KEY);
    return res.status(201).json({token});
  }
  return res.json({"error": "Username or password is invalid."})
})



/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res, next) {
  // TODO: Make middleware to check for empty body make sure all
  // needed fields are included

  // TODO: Try catch for duplicate username

  if (req.body === undefined) throw new BadRequestError("Body must be included.");

  const { username, password, first_name, last_name, phone } = req.body;
  const result = await User.register({username, password, first_name, last_name, phone});


  const payload = {"username": result.username}
  const token = jwt.sign(payload, SECRET_KEY);


  return res.status(201).json({token});

});

module.exports = router;