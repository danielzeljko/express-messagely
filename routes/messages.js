"use strict";

const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message");
const {authenticateJWT, ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth")
const {BadRequestError} = require("../expressError")

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", authenticateJWT, ensureLoggedIn, async function(req, res, next) {
  //TODO: refactor line 28 to middleware or static method in messages
  const {id} = req.params;
  const currentUser = res.locals.user.username;
  const message = await Message.get(id);

  if(currentUser === message.from_user.username || currentUser === message.to_user.username) {
    return res.json({message});
  }
  throw new BadRequestError();
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", authenticateJWT, ensureLoggedIn, async function(req, res, next){

  // TODO: Make a middleware
  // TODO: Make sure recipient exists or throw an error

  if(req.body === undefined) throw new BadRequestError("Body must be included.");
  const {to_username, body} = req.body;
  if(to_username === undefined || body === undefined){
    throw new BadRequestError("Message body and to_username must be included.")
  }

  const message = await Message.create({
    from_username: res.locals.user.username,
    to_username,
    body
  });

  return res.status(201).json({message})
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", authenticateJWT, ensureLoggedIn, async function(req, res, next) {
  const {id} = req.params;
  const currentUser = res.locals.user.username;
  const message = await Message.get(id);

  if(currentUser === message.to_user.username) {
    const messageRead = await Message.markRead(id);
    return res.json({ message:messageRead });
  }
  throw new BadRequestError("You cannot mark this message as read.");
})


module.exports = router;