const MongoClient = require('mongodb').MongoClient;

createMail = async (notification) => {
  return new Promise(async (resolve, reject) => {
    // Verify
    if (notification.mongo.MONGOURL && notification.mongo.DATABASE_NAME && notification.mongo.SCHEMA_NAME) {
      // Connect
      const mongoClient = await MongoClient.connect(notification.mongo.MONGOURL, {
        useUnifiedTopology: true
      });

      try {
        // Insert
        const db = mongoClient.db(notification.mongo.DATABASE_NAME);
        const createMailResult = await db.collection(notification.mongo.SCHEMA_NAME).insertOne(notification.data);
        // console.log('notif-engine.createMail.mongo.result ', notification.data.id, ' ', notification.data.email);
        resolve(createMailResult);
      } catch (error) {
        // Catch all errors
        console.log('notif-engine.createMail.mongo.error ', error);
        reject({ message: 'notif-engine.createMail.error ', data: error });
      } finally {
        // Disconnect
        mongoClient.close();
      }
    } else {
      console.log('notif-engine.createMail.badRequest.error ', error);
      reject({ message: 'Improper credentials, notif-engine.createMail.badRequest.error' });
    }
  });
};

createNotificationTransaction = async (notificationTransaction) => {
  return new Promise(async (resolve, reject) => {
    // Verify
    if (notificationTransaction.mongo.MONGOURL && notificationTransaction.mongo.DATABASE_NAME && notificationTransaction.mongo.SCHEMA_NAME) {
      // Connect
      const mongoClient = await MongoClient.connect(notificationTransaction.mongo.MONGOURL, {
        useUnifiedTopology: true
      });

      try {
        // Insert
        const db = mongoClient.db(notificationTransaction.mongo.DATABASE_NAME);
        const createNotificationTransactionResult = await db.collection(notificationTransaction.mongo.SCHEMA_NAME).insertOne(notificationTransaction.data);
        // console.log('notif-engine.createNotificationTransaction.mongo.result ', notificationTransaction.data.id, ' ', notificationTransaction.data.email);
        resolve(createNotificationTransactionResult);
      } catch (error) {
        // Catch all errors
        console.log('notif-engine.createNotificationTransaction.mongo.error ', error);
        reject({ message: 'notif-engine.createNotificationTransaction.error ', data: error });
      } finally {
        // Disconnect
        mongoClient.close();
      }
    } else {
      console.log('notif-engine.createNotificationTransaction.badRequest.error ', error);
      reject({ message: 'Improper credentials, notif-engine.createMail.badRequest.error' });
    }
  });
};

module.exports = {
  createNotificationTransaction: createNotificationTransaction,
  createMail: createMail
};
