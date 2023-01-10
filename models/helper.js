function serializeMessagesFrom({
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

function serializeMessagesTo(
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

module.exports = { serializeMessagesFrom, serializeMessagesTo };