"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");

const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone
      `, [username, hashed_password, first_name, last_name, phone]
    );
    return result.rows[0];
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

    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError(`${username} is not a valid user`);
    }

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY username`
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
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user === undefined) {
      throw new NotFoundError(`${username} is not a valid user`);
    }
    return user;
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
      `SELECT m.id,
              m.body,
              m.sent_at,
              m.read_at,
              m.to_username,
              t.first_name AS to_first_name,
              t.last_name AS to_last_name,
              t.phone AS to_phone
            FROM messages AS m
              JOIN users AS t ON m.to_username = t.username
        WHERE m.from_username = $1`,
      [username]
    );

    return result.rows.map(o => User._serializeMessagesFrom(o));
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
        WHERE m.to_username = $1`,
      [username]
    );

    return result.rows.map(o => User._serializeMessagesTo(o));
  }

/** serialize message_from object */
 static _serializeMessagesFrom({
  id,
  to_username,
  to_first_name,
  to_last_name,
  to_phone,
  body,
  sent_at,
  read_at}) {

  return{
    id,
    to_user: {
      username: to_username,
      first_name: to_first_name,
      last_name: to_last_name,
      phone:to_phone,
    },
    body,
    sent_at,
    read_at,
  };
}

/** serialize message_to object */
static _serializeMessagesTo(
  {id,
  username,
  from_first_name,
  from_last_name,
  from_phone,
  body,
  sent_at,
  read_at}) {

  return{
    id,
    from_user: {
      username: username,
      first_name: from_first_name,
      last_name: from_last_name,
      phone: from_phone,
    },
    body,
    sent_at,
    read_at,
  };
  }

}


module.exports = User;
