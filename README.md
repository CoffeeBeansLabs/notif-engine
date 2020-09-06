# notif-engine

The 'notif-engine' is an 'npm module' to store notifications before sending them in the supported data stores and then send them through supported providers; nevertheless, it updates the status of sending the notifications in your data store.

- [Features](#features)
- [How to use](#how-to-use)
- [Contributing](#contributing)
- [Need help? Found a bug?](#need-help-found-a-bug-feature-request)
- [Vote of thanks to the community for](#vote-of-thanks-to-the-community-for)

## Features

* **Easy notification storage (multiple channel support)** — Store `email` | `push` before sending them. Currently supports MongoDB as the data store.

* **Easy notification sending** — Send `email` | `push` through supported providers and update the status in your data store. Currently supports [Amazon Simple Email Service](https://aws.amazon.com/ses/) for emails and [OneSignal](https://onesignal.com/) for push notifications.

* **Multi lingual template support** — Define templates in multiple languages and use them.

* **MIT license** — Use it like you want.

## How to use

### Installation for using as a producer

#### [Via npm](https://www.npmjs.com/package/@coffeebeanslabs/notif-engine)

```shell
$ npm i @coffeebeanslabs/notif-engine
```

#### [Via yarn](https://classic.yarnpkg.com/en/package/@coffeebeanslabs/notif-engine)

```shell
$ yarn add @coffeebeanslabs/notif-engine
```

#### Producing email from your code
```javascript
const notifEngine = require('@coffeebeanslabs/notif-engine');

await notifEngine.createNotificationTransaction({
  mongo: {
    MONGOURL: '<your_mongourl_or_mongoclusterurls>',
    DATABASE_NAME: '<same-as-dynamic.mail.database_name-in-consumer/configurations/configuration.json>',
    SCHEMA_NAME: '<same-as-dynamic.mail.schema_name-in-consumer/configurations/configuration.json>',
  },
  data: {
    server: '<your_operating_server_type_localhost/staging/production'>,
    type: 'mail',
    provider: 'amazonses',
    trigger_event: 'create',
    notification_template_slug: 'welcome',
    user_id: ['your_user_ids_as_array_of_strings_for_users_targeted_in_the_notification_this_helps_for_filtering_and_reporting_purposes_only'],
    user_email: ['your_user_email_ids_as_array_of_strings_for_users_targeted_in_the_notification_this_helps_for_filtering_and_reporting_purposes_only'],
    data: [{
      user_id: 'each_values_in_data.user_id_will_have_one_object_each_in_data.data',
      user_email: 'each_values_in_data.user_email_will_have_one_object_each_in_data.data',
      user_name: 'your_user\'s_name',
      user_language: 'your_user\'s_language_must_be_one_of_defined_inside_the_respective_template_in_template_schema',
      brand_name: '<your_brand_name>',
      verification_link: '<your_verification_link>',
      brand_url: '<your_brand_url_link>',
      brand_url_without_protocol: '<your_brand_url_link_without_protocol>',
      attachments: ['your_file_paths_as_array_of_strings_compatible_with_nodemailer'],
      include_player_ids: ['your_onesignal_player_ids_targeted_in_the_notification']
    }],
    status: -1,
    db_created_at: <timestamp>,
    db_updated_at: <timestamp>
  }
});
```

#### Producing push from your code
```javascript
const notifEngine = require('@coffeebeanslabs/notif-engine');

await notifEngine.createNotificationTransaction({
  mongo: {
    MONGOURL: '<your_mongourl_or_mongoclusterurls>',
    DATABASE_NAME: '<same-as-dynamic.push.database_name-in-consumer/configurations/configuration.json>',
    SCHEMA_NAME: '<same-as-dynamic.push.schema_name-in-consumer/configurations/configuration.json>',
  },
  data: {
    server: '<your_operating_server_type_localhost/staging/production'>,
    type: 'push',
    provider: 'onesignal',
    trigger_event: 'create',
    notification_template_slug: 'welcome',
    user_id: ['your_user_ids_as_array_of_strings_for_users_targeted_in_the_notification_this_helps_for_filtering_and_reporting_purposes_only'],
    user_email: ['your_user_email_ids_as_array_of_strings_for_users_targeted_in_the_notification_this_helps_for_filtering_and_reporting_purposes_only'],
    data: [{
      user_id: 'each_values_in_data.user_id_will_have_one_object_each_in_data.data',
      user_email: 'each_values_in_data.user_email_will_have_one_object_each_in_data.data',
      user_name: 'your_user\'s_name',
      user_language: 'your_user\'s_language_must_be_one_of_defined_inside_the_respective_template_in_template_schema',
      brand_name: '<your_brand_name>',
      verification_link: '<your_verification_link>',
      brand_url: '<your_brand_url_link>',
      brand_url_without_protocol: '<your_brand_url_link_without_protocol>',
      attachments: ['your_file_paths_as_array_of_strings_compatible_with_nodemailer'],
      include_player_ids: ['your_onesignal_player_ids_targeted_in_the_notification']
    }],
    status: -1,
    db_created_at: <timestamp>,
    db_updated_at: <timestamp>
  }
});
```


### Installation for using as a consumer process

#### Setting up the consumer process
```shell
$ git@github.com:CoffeeBeansLabs/notif-engine.git && cd notif-engine && npm install
```
or
```shell
$ https://github.com/CoffeeBeansLabs/notif-engine.git && cd notif-engine && npm install
```

#### Setting up the consumer process

- Create a new file at `consumer/configurations/configuration.json` manually or by copy pasting and editing the contents of `consumer/configurations/configuration.template.json`
- Be sure to at least update the `<database_name_here>`, `<schema_name_here>` and `'Full Name' <email@address.com>` in the file
- You are now ready to turn on the consumer process
- The `batch_size` is for the quantum of messages being read in a single read for sending
- The `max_retries` is for the number of attempts being done while sending, if the sending fails
- As a rule of thumb, for all schemas the meaning of the statuses is as below :
  - `-2` = `SENDING_FAILED`
  - `-1` = `NOT_PROCESSED` // The default which has to be set for produced notifications to get created and then sent
  - `0` = `PROCESSING`  
  - `1` = `SENDING_SUCCEEDED`
- As a rule of thumb, for all schemas the meaning of the enabled_flags is as below :
  - `1` = `ENABLED`
  - `0` = `DISABLED`

#### Turning on the consumer process

>
>SESHOST="<amazonses_host>" SESPORT=<amazonses_port> SESISSECURE=<amazonses_is_secure_flag_integer_0_or_1> SESUSER="<amazonses_user>" SESPASS="<amazonses_password>" OSAPPID="<onesignal_appid>" OSAPIKEY="<onesignal_apikey>" MONGOURL="<your_mongourl_or_mongoclusterurls>" node consumer/app.js
>

### Concepts for entities involved

#### tl;dr

- Templates form the base content layout for all the channels and are prerequisite for the `notif-engine` to work
- Transactions are produced from your code into the `notif-engine` to have enough data to produce the actual notifications for respective channels
- `notif-engine` runs and creates respective channel notifications (`email` | `push`) in their specified schemas
- For producer, the configuration is passed as parameters to the function calls
- For consumer, the `consumer/configurations/configuration.json` is the base for the configuration and the consumer process works on this. This file is to be created manually before turning on the consumer process and a template is available for the same at `consumer/configurations/configuration.template.json`

#### Templates

- The templates provide a mechanism to configure a base for each supported channel which will be string replaced by the data in transactions to generate the actual data that will be stored in the respective collections of that respective channel and this actual data stored will be used to send the notification via the configured service provider
- [Reference for designing email templates](https://nodemailer.com/message/)
- [Reference for designing html inside the email templates](https://templates.mailchimp.com/development/html/)
- [Reference for designing push templates for onesignal](https://documentation.onesignal.com/reference/create-notification)
- HTML output for the ```en``` email template below
![notif-engine-email-template-preview](https://raw.githubusercontent.com/CoffeeBeansLabs/notif-engine/master/meta/img/notif-engine-email-template-preview.png)
- Push output for the ```en``` push template below
![notif-engine-push-template-preview](https://raw.githubusercontent.com/CoffeeBeansLabs/notif-engine/master/meta/img/notif-engine-push-template-preview.png)
- Setting up test data for templates manually
  - ```<schema_name_here>``` is the collection which stores templates data and has to be configured in ```consumer/configurations/configuration.json base.template.schema_name``` for using the module
  - ```slug``` identifier for the template, as database primary keys/id keys may change but this will always be consistent for retrieval
  - ```name``` human readable string for describing the template
  - ```inapp_template``` inapp notification template for the template in consideration
  - ```email_template``` email notification template for the template in consideration
  - ```email_template.provider``` email notification provider
  - ```email_template.subject``` email notification subject which supports multiple languages as keys with values of text in that language(can be string replaced to personalize/customize)
  - ```email_template.html``` email notification html/content which supports multiple languages as keys with values of text in that language(can be string replaced to personalize/customize)
  - ```email_template.attachments``` email notification attachments as supported by [nodemailer](https://nodemailer.com/message/attachments/)
  - ```push_template``` push notification template for the template in consideration
  - ```push_template.provider``` push notification provider
  - ```push_template.headings``` push notification heading which supports multiple languages as keys with values of text in that language(can be string replaced to personalize/customize)
  - ```push_template.subtitle``` push notification subtitle which supports multiple languages as keys with values of text in that language(can be string replaced to personalize/customize)
  - ```push_template.contents``` push notification contents which supports multiple languages as keys with values of text in that language(can be string replaced to personalize/customize)
  - ```push_template.url``` push notification hyperlink to open (external url or internal deep links to the app)
  - ```push_template.android_accent_color``` push notification accent color for android devices
  - ```push_template.huawei_accent_color``` push notification accent color for huawei devices
  - ```push_template.android_led_color``` push notification led color for android devices
  - ```push_template.huawei_led_color``` push notification led color for huawei devices
  - ```sms_template``` sms notification template for the template in consideration
  - ```is_enabled``` switch for turning on/off the usage of template in consideration
  
```javascript
db.getCollection('<schema_name_here>').insertOne({
    "slug" : "welcome",
    "name" : "welcome mail with verification link",
    "inapp_template" : null,
    "email_template" : {
        "provider" : "amazonses",
        "subject" : {
            "en" : "Welcome to CoffeeBeans Consulting LLP!",
            "in" : "Selamat Datang di CoffeeBeans Consulting LLP!"
        },
        "html" : {
            "en" : "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" height=\"100%\" width=\"100%\" id=\"bodyTable\"> <tr> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"600\" id=\"emailContainer\" style=\"border-radius: 10px;box-shadow: 0 2.8px 2.2px rgba(0, 0, 0, 0.034), 0 6.7px 5.3px rgba(0, 0, 0, 0.048), 0 12.5px 10px rgba(0, 0, 0, 0.06), 0 22.3px 17.9px rgba(0, 0, 0, 0.072), 0 41.8px 33.4px rgba(0, 0, 0, 0.086), 0 100px 80px rgba(0, 0, 0, 0.12)\"> <tr style=\"background-color: #f7dc61;\"> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\" id=\"emailHeader\"> <tr> <td align=\"center\" valign=\"top\"> <img src=\"https://www.coffeebeans.io/images/logo-a8559bab.png\" alt=\"CoffeeBeans Consulting LLP logo\" width=\"50\" height=\"50\"> </td></tr></table> </td></tr><tr> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\" id=\"emailBody\"> <tr> <td align=\"left\" valign=\"top\"> Hi {{user_name}}, <br/><br/>Welcome! We are incredibly excited to have you on {{brand_name}}. We applaud your fantastic decision :). <br/><br/> Please click on the following verification link to verify your email and enjoy all the benefits of using {{brand_name}} : <a href=\"{{verification_link}}\" target=\"_blank\" style=\"text-decoration: none;color: #f7dc61;\">{{verification_link}}</a><br/><br/>Cheers, <br/>{{brand_name}}</td></tr></table> </td></tr><tr> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\" id=\"emailFooter\"> <tr> <td align=\"center\" valign=\"top\"><a href=\"{{brand_url}}\" target=\"_blank\" style=\"text-decoration: none;color: #f7dc61;\">{{brand_url_without_protocol}}</a> </td></tr></table> </td></tr></table> </td></tr></table>",
            "in" : "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" height=\"100%\" width=\"100%\" id=\"bodyTable\"> <tr> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"600\" id=\"emailContainer\" style=\"border-radius: 10px;box-shadow: 0 2.8px 2.2px rgba(0, 0, 0, 0.034), 0 6.7px 5.3px rgba(0, 0, 0, 0.048), 0 12.5px 10px rgba(0, 0, 0, 0.06), 0 22.3px 17.9px rgba(0, 0, 0, 0.072), 0 41.8px 33.4px rgba(0, 0, 0, 0.086), 0 100px 80px rgba(0, 0, 0, 0.12)\"> <tr style=\"background-color: #f7dc61;\"> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\" id=\"emailHeader\"> <tr> <td align=\"center\" valign=\"top\"> <img src=\"https://www.coffeebeans.io/images/logo-a8559bab.png\" alt=\"CoffeeBeans Consulting LLP logo\" width=\"50\" height=\"50\"> </td></tr></table> </td></tr><tr> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\" id=\"emailBody\"> <tr> <td align=\"left\" valign=\"top\"> Hai {{user_name}}, <br/> <br/> Selamat datang! Kami sangat senang menerima Anda di {{brand_name}}. Kami menghargai keputusan fantastis Anda :). <br/> <br/> Silakan klik tautan verifikasi berikut untuk memverifikasi email Anda dan nikmati semua manfaat menggunakan {{brand_name}} : <a href=\"{{verification_link}}\" target=\"_blank\" style=\"text-decoration: none;color: #f7dc61;\">{{verification_link}}</a><br/> <br/> Ceria, <br / >{{brand_name}}</td></tr></table> </td></tr><tr> <td align=\"center\" valign=\"top\"> <table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"100%\" id=\"emailFooter\"> <tr> <td align=\"center\" valign=\"top\"><a href=\"{{brand_url}}\" target=\"_blank\" style=\"text-decoration: none;color: #f7dc61;\">{{brand_url_without_protocol}}</a> </td></tr></table> </td></tr></table> </td></tr></table>"
        },
        "attachments" : []
    },
    "push_template" : {
        "provider" : "onesignal",
        "headings" : {
            "en" : "Welcome!",
            "in" : "Selamat datang!"
        },
        "subtitle" : {
            "en" : "Excited to have you onboard",
            "in" : "Senang melihat Anda bergabung"
        },
        "contents" : {
            "en" : "Hi {{user_name}}, we are incredibly excited to have you onboard and have sent you a verification email.",
            "in" : "Halo {{user_name}}, kami sangat senang Anda bergabung dan mengirimkan email verifikasi."
        },
        "url" : "https://www.coffeebeans.io",
        "android_accent_color" : "FFFF0000",
        "huawei_accent_color" : "FFFF0000",
        "android_led_color" : "FF0000FF",
        "huawei_led_color" : "0000FF"
    },
    "sms_template" : null,
    "is_enabled" : 1
});
```

## Contributing

### Pull requests
And, of course, feel free to submit pull requests with bug fixes/changes/feature additions. All contributions are always welcomed!

To get started: [fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.

```shell
$ git clone git@github.com:[YOUR_USERNAME]/notif-engine.git && cd notif-engine && npm install
```

### [Publish on npm](https://www.npmjs.com/package/np)
```shell
$ np
```

### [Publish on yarn](https://classic.yarnpkg.com/en/docs/publishing-a-package/)
```shell
$ yarn publish
$ yarn info @coffeebeanslabs/notif-engine // for package info
```

Then add, commit, push to your repo and finally send a [pull request](https://help.github.com/articles/creating-a-pull-request/)


## Need Help? Found a bug? Feature Request?

[Feel free to open an issue](https://github.com/CoffeeBeansLabs/notif-engine/issues).


## Vote of thanks to the community for
- [MongoDB Node.JS Driver](https://www.npmjs.com/package/mongodb)
- [Nodemailer](https://www.npmjs.com/package/nodemailer)
- [onesignal-node](https://www.npmjs.com/package/onesignal-node)
- [Sindre Sorhus](https://github.com/sindresorhus) for the amazing module [np](https://www.npmjs.com/package/np). This module has been of immense help, making ```npm publish``` easy and blazing fast.
