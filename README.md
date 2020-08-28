# notif-engine

The 'notif-engine' is a 'npm module' to store notifications before sending them in the supported data stores and then send them through supported providers; nevertheless, it updates the status of sending the notifications in your data store.

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
