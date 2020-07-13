const NotificationFactory = require('./factories/notificationFactory.js');
const MongoClient = require('mongodb').MongoClient;
const NotificationConfig = require('./configurations/configuration.json');
const NOTIFICATION_STATUSES = NotificationConfig.statuses;
let TIMEOUT = 1000;

// Processing the notifications based on their type
const sendTypeBasedNotifications = async (notification) => {
  // console.log('sendTypeBasedNotifications');
  // Get class based on the type of notification from the factory
  const notificationClassForType = NotificationFactory.getClassForType(notification.type);
  // Wait until sendNotification resolves or rejects
  await notificationClassForType.prototype.sendNotification(notification);
}

// Processing the notifications
const processNotifications = async (toBeSentNotifications) => {
  // console.log('processNotifications');
  // Map array to promises
  const toBeSentNotificationsPromises = toBeSentNotifications.map(sendTypeBasedNotifications);
  // Wait until all toBeSentNotificationsPromises are resolved
  return Promise.all(toBeSentNotificationsPromises);
}

// Reset eligible failed notifications and read from schema
const readNotificationsFromSchema = async (dynamicNotificationType) => {
  // console.log('readNotificationsFromSchema');
  const MONGOURL = process.env.MONGOURL || '';

  // Verify
  if (MONGOURL) {
    // Connect
    const mongoClient = await MongoClient.connect(MONGOURL, {
      useUnifiedTopology: true
    });
    try {
      // Reset and read
      const db = mongoClient.db(NotificationConfig['dynamic'][dynamicNotificationType]['database_name']);
      const collection = db.collection(NotificationConfig['dynamic'][dynamicNotificationType]['schema_name']);
      const resetResult = await collection.updateMany({ status: NOTIFICATION_STATUSES['SENDING_FAILED'], try_count: { $lte: NotificationConfig['dynamic'][dynamicNotificationType]['max_retries'] } }, { $set: { status: NOTIFICATION_STATUSES['NOT_PROCESSED'] } });
      const readResult = await collection.find({ status: NOTIFICATION_STATUSES['NOT_PROCESSED'] }).limit(NotificationConfig['dynamic'][dynamicNotificationType]['batch_size']).toArray();
      return readResult;
    } catch (resetReadError) {
      throw resetReadError;
    } finally {
      // Disconnect
      mongoClient.close();
    }
  } else {
    throw { message: 'Improper credentials, readNotificationsFromSchema failed' };
  }
}

// Reading the notifications from the schema of objects in notificationConfig
const readNotifications = async (notificationConfig) => {
  // console.log('readNotifications');
  // Map array to promises
  const fetchToBeSentNotificationsPromises = Object.keys(notificationConfig['dynamic']).map(readNotificationsFromSchema);

  // const {client, db} = getDb();
  // Wait until all fetchToBeSentNotificationsPromises are resolved
  Promise.all(fetchToBeSentNotificationsPromises).then(async (toBeSentNotificationsResult) => {
    // console.log('readNotifications.toBeSentNotificationsResult ', toBeSentNotificationsResult);
    await processNotifications(toBeSentNotificationsResult.flat());
    // client.close();
  }).catch((toBeSentNotificationsError) => {
    console.log('readNotifications.toBeSentNotificationsError ', toBeSentNotificationsError);
    process.exit(-1);
  });
}

// Entry point
const startNotifEngine = async () => {
  // Execute after every TIMEOUT ms
  setInterval(() => {
    console.log('\nengine iteration invoked at ', new Date().toString());
    console.time('iteration_time');
    readNotifications(NotificationConfig);
    console.log('\nengine iteration returned at ', new Date().toString());
    console.timeEnd('iteration_time');
  }, TIMEOUT);
}

// Fire up the engine
startNotifEngine();
// readNotifications(NotificationConfig);