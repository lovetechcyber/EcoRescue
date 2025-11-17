switch (userInput) {
  case "1":
    response  = "CON Enter phone number:";
    break;

  case "1*{phone}":
    response = "CON Enter OTP:";
    break;

  case "1*{phone}*{otp}":
    // verify OTP same as API
    response = "END Login successful!";
    break;
}

const AfricasTalking = require('../config/africastalking'); // wrapper returning initialized AT SDK
const User = require('../models/User');
const Report = require('../models/Report');
const { makePoint } = require('../utils/geo');
// We'll use Redis to keep session progress keyed by sessionId or phone

const { getRedis } = require('../config/redis');

function parseSessionText(text) {
  // text is the concatenation of user inputs separated by '*' in AT flow
  return text ? text.split('*') : [];
}

async function ussdHandler(req, res) {
  /**
   * Africa's Talking USSD POST payload typically:
   * { sessionId, serviceCode, phoneNumber, text }
   */
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  const redis = getRedis();
  const parts = parseSessionText(text);
  const level = parts.length;

  let response;
  if (text === '') {
    // new session
    response = `CON Welcome to EcoRescue\n1. Report Flood\n2. Report Waste\n3. Cancel`;
    await redis.set(`ussd:${sessionId}`, JSON.stringify({ step: 'menu' }), { EX: 300 });
    return res.send(response);
  }

  const sessionRaw = await redis.get(`ussd:${sessionId}`);
  const session = sessionRaw ? JSON.parse(sessionRaw) : {};

  if (level === 1) {
    const choice = parts[0];
    if (choice === '1' || choice === '2') {
      session.reportType = (choice === '1') ? 'flood' : 'waste';
      session.step = 'ask_location';
      await redis.set(`ussd:${sessionId}`, JSON.stringify(session), { EX: 300 });
      response = 'CON Please enter location (landmark/street):';
      return res.send(response);
    } else {
      response = 'END Cancelled. Thank you.';
      return res.send(response);
    }
  } else if (level === 2) {
    // second input is location
    session.locationText = parts[1];
    session.step = 'ask_severity';
    await redis.set(`ussd:${sessionId}`, JSON.stringify(session), { EX: 300 });
    response = 'CON How severe is this? 1. Low 2. Medium 3. High';
    return res.send(response);
  } else if (level === 3) {
    // third input is severity
    const severityInput = parts[2];
    const severity = severityInput === '1' ? 'low' : severityInput === '2' ? 'medium' : 'high';
    // Persist minimal user if not exists
    let user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      user = await User.create({ phone: phoneNumber, fullName: phoneNumber, isPhoneVerified: true });
    }
    // create report with approximate location (we don't have coords) — store locationText in metadata
    const report = await Report.create({
      reporter: user._id,
      type: session.reportType,
      description: session.locationText,
      images: [],
      location: { type: 'Point', coordinates: [0, 0] }, // unknown coords
      severity,
      metadata: { via: 'ussd', locationText: session.locationText, phone: phoneNumber }
    });

    // send SMS confirmation
    const sms = AfricasTalking.SMS;
    const msg = `Thank you. Your ${session.reportType} report (ID: ${report._id}) was received. We will notify you of updates. Reply HELP for support.`;
    await sms.send({ to: [phoneNumber], message: msg });

    // cleanup session
    await redis.del(`ussd:${sessionId}`);

    response = `END Thank you. Your report has been submitted. Ref: ${report._id}`;
    return res.send(response);
  }

  // fallback
  return res.send('END Something went wrong. Try again later.');
}

module.exports = { ussdHandler };

