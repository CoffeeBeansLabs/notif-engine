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

* **MIT license** — Use it like you want.

## How to use

### Concepts for entities involved
<details><summary>Templates </summary><p>

- The templates provide a mechanism to configure a base for each supported channel which will be string replaced by the data in transactions to generate the actual data that will be stored in the respective collections of that respective channel and this actual data stored will be used to send the notification via the configured service provider
- [Reference for designing html email templates](https://templates.mailchimp.com/development/html/)
- [Reference for designing push templates for onesignal](https://documentation.onesignal.com/reference/create-notification)
- Setting up test data for templates manually
  - <schema_name_here> is the collection which stores templates data and has to be configured in ```consumer/configurations/configuration.json``` for using the module
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

</p></details>

### Turning on the notif-engine consumer process

>
>SESHOST="<amazonses_host>" SESPORT=<amazonses_port> SESISSECURE=<amazonses_is_secure_flag_integer_0_or_1> SESUSER="<amazonses_user>" SESPASS="<amazonses_password>" OSAPPID="<onesignal_appid>" OSAPIKEY="<onesignal_apikey>" MONGOURL="<your_mongourl_or_mongoclusterurls>" node consumer/app.js
>

## Contributing

And, of course, feel free to submit pull requests with bug fixes/changes/feature additions. All contributions are always welcomed!

To get started: [fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.

```shell
$ git clone git@github.com:[YOUR_USERNAME]/notif-engine.git && cd notif-engine && npm install
```

Then add, commit, push to your repo and finally send a [pull request](https://help.github.com/articles/creating-a-pull-request/)


## Need Help? Found a bug? Feature Request?

[Feel free to open an issue](https://github.com/CoffeeBeansLabs/notif-engine/issues).


## Vote of thanks to the community for
- [MongoDB Node.JS Driver](https://www.npmjs.com/package/mongodb)
- [Nodemailer](https://www.npmjs.com/package/nodemailer)
- [onesignal-node](https://www.npmjs.com/package/onesignal-node)
- [Sindre Sorhus](https://github.com/sindresorhus) for the amazing module [np](https://www.npmjs.com/package/np). This module has been of immense help, making ```npm publish``` easy and blazing fast.
