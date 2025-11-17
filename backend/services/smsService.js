const at = require("../config/africastalking");

exports.sendSMS = async (to, message) => {
  const sms = at.SMS;
  await sms.send({
    to: [to],
    message
  });
};
