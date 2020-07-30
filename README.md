# notif-engine

## Turning on the notif-engine consumer process
```
SESHOST="<amazonses_host>" SESPORT=<amazonses_port> SESISSECURE=<amazonses_is_secure_flag_integer_0_or_1> SESUSER="<amazonses_user>" SESPASS="<amazonses_password>" OSAPPID="<onesignal_appid>" OSAPIKEY="<onesignal_apikey>" MONGOURL="<your_mongourl_or_mongoclusterurls>" node consumer/app.js
```

## Thanks
- [Sindre Sorhus](https://github.com/sindresorhus) for the amazing module [np](https://www.npmjs.com/package/np)
