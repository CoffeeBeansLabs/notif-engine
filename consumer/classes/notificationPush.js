const OneSignal = require('onesignal-node');
const MongoClient = require('mongodb').MongoClient;
const NotificationConfig = require('../configurations/configuration.json');
const NOTIFICATION_STATUSES = NotificationConfig.statuses;

function notificationPush() {
}

notificationPush.prototype = {
  // Send notification by PROCESSING => sendMail => SENDING_SUCCEEDED or SENDING_FAILED
  sendNotification: (notification) => {
    return new Promise(async (resolve, reject) => {
      // Custom behavior here based on provider
      switch (notification.provider) {
        case 'onesignal':
          // Implementation for onesignal as push notifications provider
          const OS_APP_ID = process.env.OSAPPID || '';
          const OS_API_KEY = process.env.OSAPIKEY || '';
          const MONGOURL = process.env.MONGOURL || '';

          // Verify
          if (OS_APP_ID && OS_API_KEY && MONGOURL) {
            console.log('notificationMail.sendNotification.onesignal.notification._id ', notification._id);

            // Connect
            const mongoClient = await MongoClient.connect(MONGOURL, {
              useUnifiedTopology: true
            });

            try {
              // Update status to PROCESSING
              const db = mongoClient.db(NotificationConfig['dynamic']['push']['database_name']);
              const setAsProcessingResult = await db.collection(NotificationConfig['dynamic']['push']['schema_name']).updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['PROCESSING'] } });

              // Send push
              const client = new OneSignal.Client(OS_APP_ID, OS_API_KEY);
              const createNotificationResponse = await client.createNotification(notification.data);
              console.log('notificationPush.sendNotification.onesignal.client.createNotification.createNotificationResponse ', createNotificationResponse.statusCode, ' ', createNotificationResponse.body.id, ' for ', notification._id);

              if (createNotificationResponse && createNotificationResponse.statusCode === 200 && createNotificationResponse.body.id) {
                // Update status to SENDING_SUCCEEDED, bump try_count and store service_response
                const setAsSendingSucceededResult = await db.collection(NotificationConfig['dynamic']['push']['schema_name']).updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_SUCCEEDED'], service_response: createNotificationResponse, try_count: notification.try_count + 1 } });
              } else {
                // Update status to SENDING_FAILED, bump try_count and store service_response
                const setAsSendingFailedResult = await db.collection(NotificationConfig['dynamic']['push']['schema_name']).updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_FAILED'], service_response: createNotificationResponse, try_count: notification.try_count + 1 } });
              }

              resolve(createNotificationResponse);
            } catch (sendNotificationError) {
              console.log('notificationMail.sendNotification.onesignal.sendNotificationError for ', notification._id);
              reject(sendNotificationError);
            } finally {
              // Disconnect
              mongoClient.close();
            }
          } else {
            reject({ message: 'Improper credentials, notificationPush.sendNotification.onesignal failed' });
          }
          break;
        default:
          reject({ message: 'Improper provider, notificationPush.sendNotification failed' });
          break;
      }
    });
  }
}

module.exports = notificationPush;