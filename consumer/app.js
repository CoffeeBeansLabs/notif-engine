const NotificationFactory = require('./factories/notificationFactory.js');
const MongoClient = require('mongodb').MongoClient;
const NotificationConfig = require('./configurations/configuration.json');
const NOTIFICATION_STATUSES = NotificationConfig.statuses;
const NOTIFICATION_ENABLED_FLAGS = NotificationConfig.enabled_flags;
let TIMEOUT = 1000;

// Processing the notifications based on their type and trigger_event
const typeBasedNotificationProcessing = async (notification) => {
  // console.log('typeBasedNotificationProcessing notification', notification);
  // Get class based on the type of notification from the factory
  const notificationClassForType = NotificationFactory.getClassForType(notification.type);
  // Wait until event defined by trigger_event resolves or rejects
  if (notification.trigger_event === 'send') {
    await notificationClassForType.prototype.sendNotification(notification);
  } else if (notification.trigger_event === 'create') {
    await notificationClassForType.prototype.createNotification(notification);
  } else {
    return new Promise(async (resolve, reject) => {
      resolve({});
    });
  }

}

// Processing the notifications
const processNotifications = async (toBeSentNotifications) => {
  // console.log('processNotifications');
  // Map array to promises
  const toBeSentNotificationsPromises = toBeSentNotifications.map(typeBasedNotificationProcessing);
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





// Reset eligible failed notifications and read from schema
const createNotificationsFromSchema = async () => {
  // console.log('createNotificationsFromSchema ');
  const MONGOURL = process.env.MONGOURL || '';

  // Verify
  if (MONGOURL) {
    // Connect
    const mongoClient = await MongoClient.connect(MONGOURL, {
      useUnifiedTopology: true
    });
    try {
      // Read
      const templatesDB = mongoClient.db(NotificationConfig['base']['template']['database_name']);
      const templatesCollection = templatesDB.collection(NotificationConfig['base']['template']['schema_name']);
      const readTemplatesResult = await templatesCollection.find({ is_enabled: NOTIFICATION_ENABLED_FLAGS['ENABLED'] }).toArray();

      const transactionsDB = mongoClient.db(NotificationConfig['base']['transaction']['database_name']);
      const transactionsCollection = transactionsDB.collection(NotificationConfig['base']['transaction']['schema_name']);
      const readTransactionsResult = await transactionsCollection.find({ status: NOTIFICATION_STATUSES['NOT_PROCESSED'] }).limit(NotificationConfig['base']['transaction']['batch_size']).toArray();

      // Update to PROCESSING
      const updateStatusResult = await transactionsCollection.updateMany({ '_id': { $in: readTransactionsResult.map(x => x._id) } }, { $set: { status: NOTIFICATION_STATUSES['PROCESSING'] } });

      // Create hash for templates
      const readTemplatesObject = new Map(readTemplatesResult.map(i => [i.slug, i]));

      // Insert the template into template key
      readTransactionsResult.forEach((notificationTransaction) => {
        notificationTransaction.template = readTemplatesObject.get(notificationTransaction.notification_template_slug);
      });

      return readTransactionsResult;
    } catch (dualReadError) {
      throw dualReadError;
    } finally {
      // Disconnect
      mongoClient.close();
    }
  } else {
    throw { message: 'Improper credentials, createNotificationsFromSchema failed' };
  }
}

// Creating the notifications from the schema of objects in notificationConfig
const createNotifications = async (notificationConfig) => {
  // console.log('createNotifications');
  // Map array to promises
  const fetchToBeSentNotificationsPromises = await createNotificationsFromSchema();

  // const {client, db} = getDb();
  // Wait until all fetchToBeSentNotificationsPromises are resolved
  Promise.all(fetchToBeSentNotificationsPromises).then(async (toBeSentNotificationsResult) => {
    // console.log('createNotifications.toBeSentNotificationsResult ', toBeSentNotificationsResult);
    await processNotifications(toBeSentNotificationsResult.flat());
    // client.close();
  }).catch((toBeSentNotificationsError) => {
    console.log('createNotifications.toBeSentNotificationsError ', toBeSentNotificationsError);
    process.exit(-1);
  });
}





// Entry point
const startNotifEngine = async () => {
  // Execute after every TIMEOUT ms
  setInterval(() => {
    console.log('\nengine iteration invoked at ', new Date().toString());
    console.time('iteration_time');
    createNotifications(NotificationConfig);
    readNotifications(NotificationConfig);
    console.log('\nengine iteration returned at ', new Date().toString());
    console.timeEnd('iteration_time');
  }, TIMEOUT);
}

// Fire up the engine
startNotifEngine();
// readNotifications(NotificationConfig);
// createNotifications(NotificationConfig);