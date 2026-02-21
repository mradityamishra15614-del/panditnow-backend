const axios = require("axios");

const sendSms = async (phone, message) => {
  try {
    const res = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: message,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS Sent ✅", res.data);
    return res.data;
  } catch (error) {
    console.log("SMS Error ❌", error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendSms;
