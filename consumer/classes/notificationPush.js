const OneSignal = require('onesignal-node');
const MongoClient = require('mongodb').MongoClient;
const NotificationConfig = require('../configurations/configuration.json');
const NOTIFICATION_STATUSES = NotificationConfig.statuses;

notificationPush = () => {
};

const replacementHandler = (input, transformationMapping) => {
  transformationMapping["{{"] = '';
  transformationMapping["}}"] = '';
  // console.log(transformationMapping);
  return input.replace(new RegExp(Object.keys(transformationMapping).join('|'), 'gi'), (matched) => {
    return transformationMapping[matched];
  });
};

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
            console.log('notificationPush.sendNotification.onesignal.notification._id ', notification._id);

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
              console.log('notificationPush.sendNotification.onesignal.sendNotificationError for ', notification._id);
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
  },
  // TODO : Create notifications for sending
  createNotification: (notification) => {
    return new Promise(async (resolve, reject) => {
      const MONGOURL = process.env.MONGOURL || '';

      // Verify
      if (MONGOURL) {

        const generatedPushes = [];

        // Process only if template and push_template exist
        if (notification['template'] && notification['template']['push_template'] && notification['template']['push_template']['headings'] && notification['template']['push_template']['subtitle'] && notification['template']['push_template']['contents']) {

          // Generate mails to be stored
          notification.data.forEach((toBeGeneratedNotificationsData) => {
            let newGeneratedPush = {};
            newGeneratedPush.trigger_event = 'send';
            newGeneratedPush.type = notification.type;
            newGeneratedPush.provider = notification.provider;
            newGeneratedPush.notification_transaction_id = notification._id;
            newGeneratedPush.user_id = toBeGeneratedNotificationsData.user_id;
            newGeneratedPush.user_email = toBeGeneratedNotificationsData.user_email;

            newGeneratedPush.data = {
              headings: {},
              subtitle: {},
              contents: {},
              include_player_ids: toBeGeneratedNotificationsData.include_player_ids,
            };
            Object.keys(notification['template']['push_template']['headings']).forEach((templateHeadingForConfiguredLanguage) => {
              newGeneratedPush['data']['headings'][templateHeadingForConfiguredLanguage] = replacementHandler(notification['template']['push_template']['headings'][templateHeadingForConfiguredLanguage], toBeGeneratedNotificationsData);

              // Helps identify sending server in the heading
              if (notification.server && notification.server !== 'production') {
                newGeneratedPush['data']['headings'][templateHeadingForConfiguredLanguage] = newGeneratedPush['data']['headings'][templateHeadingForConfiguredLanguage] + ' ( ' + notification.server + ' ) ';
              }
            });
            Object.keys(notification['template']['push_template']['subtitle']).forEach((templateHeadingForConfiguredLanguage) => {
              newGeneratedPush['data']['subtitle'][templateHeadingForConfiguredLanguage] = replacementHandler(notification['template']['push_template']['subtitle'][templateHeadingForConfiguredLanguage], toBeGeneratedNotificationsData);
            });
            Object.keys(notification['template']['push_template']['contents']).forEach((templateHeadingForConfiguredLanguage) => {
              newGeneratedPush['data']['contents'][templateHeadingForConfiguredLanguage] = replacementHandler(notification['template']['push_template']['contents'][templateHeadingForConfiguredLanguage], toBeGeneratedNotificationsData);
            });

            // Optional attributes
            if (notification['template']['push_template']['url']) {
              newGeneratedPush['data']['url'] = notification['template']['push_template']['url'];
            }
            if (notification['template']['push_template']['big_picture']) {
              newGeneratedPush['data']['big_picture'] = notification['template']['push_template']['big_picture'];
            }
            if (notification['template']['push_template']['buttons'] && notification['template']['push_template']['buttons'].length > 0) {
              newGeneratedPush['data']['buttons'] = notification['template']['push_template']['buttons'];
            }
            if (notification['template']['push_template']['android_accent_color']) {
              newGeneratedPush['data']['android_accent_color'] = notification['template']['push_template']['android_accent_color'];
            }
            if (notification['template']['push_template']['huawei_accent_color']) {
              newGeneratedPush['data']['huawei_accent_color'] = notification['template']['push_template']['huawei_accent_color'];
            }
            if (notification['template']['push_template']['android_led_color']) {
              newGeneratedPush['data']['android_led_color'] = notification['template']['push_template']['android_led_color'];
            }
            if (notification['template']['push_template']['huawei_led_color']) {
              newGeneratedPush['data']['huawei_led_color'] = notification['template']['push_template']['huawei_led_color'];
            }

            newGeneratedPush.status = NOTIFICATION_STATUSES['NOT_PROCESSED'];
            newGeneratedPush.service_response = null;
            newGeneratedPush.try_count = 0;

            const currentTimestamp = new Date();
            newGeneratedPush.db_created_at = currentTimestamp.getTime();
            newGeneratedPush.db_updated_at = currentTimestamp.getTime();

            generatedPushes.push(newGeneratedPush);
          });

          // Connect
          const mongoClient = await MongoClient.connect(MONGOURL, {
            useUnifiedTopology: true
          });

          try {
            // Insert pushes
            const pushesDB = mongoClient.db(NotificationConfig['dynamic']['push']['database_name']);
            const createNotificationResult = generatedPushes.length > 1 ? await pushesDB.collection(NotificationConfig['dynamic']['push']['schema_name']).insertMany(generatedPushes) : await pushesDB.collection(NotificationConfig['dynamic']['push']['schema_name']).insertOne(generatedPushes[0]);
            // console.log('createNotificationResult ', createNotificationResult);

            const notificationTransactionDB = mongoClient.db(NotificationConfig['base']['transaction']['database_name']);
            const notificationTransactionCollection = notificationTransactionDB.collection(NotificationConfig['base']['transaction']['schema_name']);

            if (!createNotificationResult) {
              // Update flag and reject
              const failedResult = await notificationTransactionCollection.updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_FAILED'] } });
              console.log('notif-engine.notificationPush.createNotification.!createNotificationResult ');
              reject({ message: 'notif-engine.notificationPush.createNotification.!createNotificationResult ' });
            } else {
              // Update flag and resolve
              const succeededResult = await notificationTransactionCollection.updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_SUCCEEDED'] } });
              console.log('notif-engine.notificationPush.createNotification.createNotificationResult notification_transaction_id', notification._id);
              resolve(createNotificationResult);
            }

          } catch (error) {
            // Catch all errors
            console.log('notif-engine.notificationPush.createNotification.mongo.error ');
            reject({ message: 'notif-engine.notificationPush.createNotification.error ' });
          } finally {
            // Disconnect
            mongoClient.close();
          }
        } else {
          // Update status to SENDING_FAILED
          // Connect
          const mongoClientForNotificationTransactionNoTemplate = await MongoClient.connect(MONGOURL, {
            useUnifiedTopology: true
          });

          try {
            const notificationTransactionDBNoTemplate = mongoClientForNotificationTransactionNoTemplate.db(NotificationConfig['base']['transaction']['database_name']);
            const notificationTransactionCollectionNoTemplate = notificationTransactionDBNoTemplate.collection(NotificationConfig['base']['transaction']['schema_name']);
            const failedResultNoTemplate = await notificationTransactionCollectionNoTemplate.updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_FAILED'] } });
            resolve(failedResultNoTemplate);
          } catch (noTemplateError) {
            console.log('notif-engine.notificationPush.createNotification.!notification[\'template\'] ');
            reject({ message: 'notif-engine.notificationPush.createNotification.!notification[\'template\'] ', data: noTemplateError });
          } finally {
            // Disconnect
            mongoClientForNotificationTransactionNoTemplate.close();
          }
        }

      } else {
        reject({ message: 'Improper credentials, notificationPush.createNotification failed' });
      }
    });
  }
}

module.exports = notificationPush;