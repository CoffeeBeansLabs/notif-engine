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

module.exports = {
  createMail: createMail
};
