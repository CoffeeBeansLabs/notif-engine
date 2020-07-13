const nodemailer = require('nodemailer');

function notificationSms() {
}

notificationSms.prototype = {
  sendNotification: (notification) => {
    return new Promise((resolve, reject) => {
      // Custom behavior here based on provider
      switch (notification.provider) {
        case 'upcoming':
          // Implementation for amazonses as mail notifications provider
          
          resolve({});
          break;
        default:
          reject({ message: 'Improper provider, notificationSms.sendNotification failed' });
          break;
      }
    });
  }
}

module.exports = notificationSms;