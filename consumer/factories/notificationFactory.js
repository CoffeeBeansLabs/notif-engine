const notificationPush = require('../classes/notificationPush.js');
const notificationMail = require('../classes/notificationMail.js');
const notificationSms = require('../classes/notificationSms.js');

const classMappings = {
  'push': { targetClass: notificationPush },
  'mail': { targetClass: notificationMail },
  'sms': { targetClass: notificationSms }
};

const getClassForType = (type) => {
  return classMappings[type].targetClass;
};

module.exports = {
  getClassForType: getClassForType
};