const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const NotificationConfig = require('../configurations/configuration.json');
const NOTIFICATION_STATUSES = NotificationConfig.statuses;

notificationMail = () => {
};

const replacementHandler = (input, transformationMapping) => {
  transformationMapping["{{"] = '';
  transformationMapping["}}"] = '';
  // console.log(transformationMapping);
  return input.replace(new RegExp(Object.keys(transformationMapping).join('|'), 'gi'), (matched) => {
    return transformationMapping[matched];
  });
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
  },
  // Create notifications for sending
  createNotification: (notification) => {
    return new Promise(async (resolve, reject) => {
      const MONGOURL = process.env.MONGOURL || '';

      // Verify
      if (MONGOURL) {

        const generatedMails = [];

        // Process only if template and email_template exist
        if (notification['template'] && notification['template']['email_template'] && notification['template']['email_template']['subject'] && notification['template']['email_template']['html']) {

          // Generate mails to be stored
          notification.data.forEach((toBeGeneratedNotificationsData) => {
            let newGeneratedMail = {};
            newGeneratedMail.trigger_event = 'send';
            newGeneratedMail.type = notification.type;
            newGeneratedMail.provider = notification.provider;
            newGeneratedMail.notification_transaction_id = notification._id;
            newGeneratedMail.user_id = toBeGeneratedNotificationsData.user_id;
            newGeneratedMail.user_email = toBeGeneratedNotificationsData.user_email;

            newGeneratedMail.data = {
              from: NotificationConfig['dynamic']['mail']['from_string'],
              to: newGeneratedMail.user_email,
              subject: notification['template']['email_template']['subject'][toBeGeneratedNotificationsData.user_language],
              html: replacementHandler(notification['template']['email_template']['html'][toBeGeneratedNotificationsData.user_language], toBeGeneratedNotificationsData) // String replace to generate the html
            };

            // Helps identify sending server in the mail subject
            if (notification.server && notification.server !== 'production') {
              newGeneratedMail.data.subject = newGeneratedMail.data.subject + ' ( ' + notification.server + ' ) ';
            }

            // Override attachments defined in the template with those in transaction
            if (toBeGeneratedNotificationsData.attachments || notification['template']['email_template']['attachments']) {
              newGeneratedMail.data.attachments = toBeGeneratedNotificationsData.attachments ? toBeGeneratedNotificationsData.attachments : notification['template']['email_template']['attachments'];
            }

            newGeneratedMail.status = NOTIFICATION_STATUSES['NOT_PROCESSED'];
            newGeneratedMail.service_response = null;
            newGeneratedMail.try_count = 0;

            generatedMails.push(newGeneratedMail);
          });

          // Connect
          const mongoClient = await MongoClient.connect(MONGOURL, {
            useUnifiedTopology: true
          });

          try {
            // Insert mails
            const mailsDB = mongoClient.db(NotificationConfig['dynamic']['mail']['database_name']);
            const createNotificationResult = generatedMails.length > 1 ? await mailsDB.collection(NotificationConfig['dynamic']['mail']['schema_name']).insertMany(generatedMails) : await mailsDB.collection(NotificationConfig['dynamic']['mail']['schema_name']).insertOne(generatedMails[0]);
            // console.log('createNotificationResult ', createNotificationResult);

            const notificationTransactionDB = mongoClient.db(NotificationConfig['base']['transaction']['database_name']);
            const notificationTransactionCollection = notificationTransactionDB.collection(NotificationConfig['base']['transaction']['schema_name']);

            if (!createNotificationResult) {
              // Update flag and reject
              const failedResult = await notificationTransactionCollection.updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_FAILED'] } });
              console.log('notif-engine.notificationMail.createNotification.!createNotificationResult ');
              reject({ message: 'notif-engine.notificationMail.createNotification.!createNotificationResult ' });
            } else {
              // Update flag and resolve
              const succeededResult = await notificationTransactionCollection.updateOne({ _id: notification._id }, { $set: { status: NOTIFICATION_STATUSES['SENDING_SUCCEEDED'] } });
              console.log('notif-engine.notificationMail.createNotification.createNotificationResult notification_transaction_id', notification._id);
              resolve(createNotificationResult);
            }

          } catch (error) {
            // Catch all errors
            console.log('notif-engine.notificationMail.createNotification.mongo.error ');
            reject({ message: 'notif-engine.notificationMail.createNotification.error ' });
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
            console.log('notif-engine.notificationMail.createNotification.!notification[\'template\'] ');
            reject({ message: 'notif-engine.notificationMail.createNotification.!notification[\'template\'] ', data: noTemplateError });
          } finally {
            // Disconnect
            mongoClientForNotificationTransactionNoTemplate.close();
          }
        }

      } else {
        reject({ message: 'Improper credentials, notificationMail.createNotification failed' });
      }
    });
  }
}

module.exports = notificationMail;