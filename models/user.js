"use strict";

const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, DB_URI} = require("../config");
const db = require("../db");

const { NotFoundError } = require("../expressError");
const { serializeMessagesFrom, serializeMessagesTo } = require("./helper");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone}) {
    const join_at = new Date()
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users
          VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING username, password, first_name, last_name, phone, join_at
      `, [username, hashed_password, first_name, last_name, phone, join_at]
    )
    return result.rows[0]
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
        [username]
    );
    const user = result.rows[0];

    if(user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
      return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const login_at = new Date()

    const result = await db.query(
      `UPDATE users
        SET last_login_at = $1
        WHERE username = $2
        RETURNING last_login_at`,
        [login_at, username]
    );

    if(!result.rows[0]) {
      throw new NotFoundError(`${username} is not a valid user`);
    }
    return;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users`
    );

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`,
        [username]
    );

    if(result.rows[0] === undefined) {
      throw new NotFoundError(`${username} is not a valid user`);
    }
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT f.username,
              m.id,
              m.body,
              m.sent_at,
              m.read_at,
              m.to_username,
              t.first_name AS to_first_name,
              t.last_name AS to_last_name,
              t.phone AS to_phone
            FROM messages AS m
              JOIN users AS f ON m.from_username = f.username
              JOIN users AS t ON m.to_username = t.username
        WHERE m.from_username = $1`,
      [username]
    );

    return result.rows.map(o => serializeMessagesFrom(o));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT f.username,
              m.id,
              m.body,
              m.sent_at,
              m.read_at,
              m.to_username,
              f.first_name AS from_first_name,
              f.last_name AS from_last_name,
              f.phone AS from_phone
            FROM messages AS m
              JOIN users AS f ON m.from_username = f.username
              JOIN users AS t ON m.to_username = t.username
        WHERE m.to_username = $1`,
      [username]
    );

    return result.rows.map(o => serializeMessagesTo(o));
  }
}

async function testUser(){
  // const test_user = await User.register({
  //   "username": "daniel",
  //   "password": "test",
  //   "first_name": "Daniel",
  //   "last_name": "Zeljko",
  //   "phone": "000-000-0000"
  // })
  // console.log({test_user})
  //const testUser = await User.authenticate("maria","asfafdad");
  //const testTimeStamp = await User.updateLoginTimestamp("maria");
  //console.log("all users", await User.all());
  //console.log("test user", testUser);
  //console.log(await User.get("daniel"));
   console.log(await User.messagesFrom("maria"));
   //console.log(await User.messagesTo("daniel"));
}

testUser();



module.exports = User;
