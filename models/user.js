"use strict";

const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, DB_URI} = require("../config");
const db = require("../db");

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
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
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
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}

async function testUser(){
  // const test_user = await User.register({
  //   "username": "maria",
  //   "password": "test",
  //   "first_name": "Maria",
  //   "last_name": "Juravic",
  //   "phone": "000-000-0000"
  // })
  // console.log({test_user})
  const testUser = await User.authenticate("maria","asfafdad");
  console.log("test user", testUser);
}

testUser();



module.exports = User;
