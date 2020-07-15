const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const NotificationConfig = require('../configurations/configuration.json');
const NOTIFICATION_STATUSES = NotificationConfig.statuses;

notificationMail = () => {
};

notificationMail.prototype = {
  // Send notification by PROCESSING => sendMail => SENDING_SUCCEEDED or SENDING_FAILED
  sendNotification: (notification) => {
    return new Promise(async (resolve, reject) => {
      // Custom behavior here based on provider
      switch (notification.provider) {
        case 'amazonses':
          // Implementation for amazonses as mail notifications provider
          const SES_HOST = process.env.SESHOST || '';
          const SES_PORT = process.env.SESPORT || '';
          const SES_IS_SECURE = process.env.SESISSECURE === 1 ? true : false; // true for 465, false for other ports
          const SES_USER = process.env.SESUSER || '';
          const SES_PASS = process.env.SESPASS || '';
          const MONGOURL = process.env.MONGOURL || '';

          // Verify
          if (SES_HOST && SES_PORT && SES_IS_SECURE === false && SES_USER && SES_PASS && MONGOURL) {
            console.log('notificationMail.sendNotification.amazonses.notification._id ', notification._id);
            // Connect
            const mongoClient = await MongoClient.connect(MONGOURL, {
              useUnifiedTopology: true
            });

            try {
              // Update status to PROCESSING
              const db = mongoClient.db(NotificationConfig['dynamic']['mail']['database_name']);
              const setAsProcessingResult = await db.collection(NotificationConfig['dynamic']['mail']['schema_name']).updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['PROCESSING'] } });

              // Send mail
              const transporter = nodemailer.createTransport({
                host: SES_HOST,
                port: SES_PORT,
                secure: SES_IS_SECURE,
                auth: {
                  user: SES_USER,
                  pass: SES_PASS,
                },
              });
              const sendMailresponse = await transporter.sendMail(notification.data);
              console.log('notificationMail.sendNotification.amazonses.transporter.sendMail.sendMailresponse ', sendMailresponse.response, ' for ', notification._id, ' accepted ', JSON.stringify(sendMailresponse.accepted), ' rejected ', JSON.stringify(sendMailresponse.rejected));

              if (sendMailresponse && sendMailresponse.response.substring(0, 3) === '250') {
                // Update status to SENDING_SUCCEEDED, bump try_count and store service_response
                const setAsSendingSucceededResult = await db.collection(NotificationConfig['dynamic']['mail']['schema_name']).updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_SUCCEEDED'], service_response: sendMailresponse, try_count: notification.try_count + 1 } });
              } else {
                // Update status to SENDING_FAILED, bump try_count and store service_response
                const setAsSendingFailedResult = await db.collection(NotificationConfig['dynamic']['mail']['schema_name']).updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_FAILED'], service_response: sendMailresponse, try_count: notification.try_count + 1 } });
              }

              resolve(sendMailresponse);
            } catch (sendNotificationError) {
              console.log('notificationMail.sendNotification.amazonses.sendNotificationError for ', notification._id);
              reject(sendNotificationError);
            } finally {
              // Disconnect
              mongoClient.close();
            }
          } else {
            reject({ message: 'Improper credentials, notificationMail.sendNotification.amazonses failed' });
          }
          break;
        default:
          reject({ message: 'Improper provider, notificationMail.sendNotification failed' });
          break;
      }
    });
  }
}

module.exports = notificationMail;