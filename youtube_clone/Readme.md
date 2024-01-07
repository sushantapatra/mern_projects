# Youtube Clone Using MERN Stack

## Technologies
Project is created with:
```
$ npm i -D nodemon
$ npm i dotenv
$ npm i -D prettier
$ npm i cookie-parser
$ npm i cors
$ npm i mongoose-aggregate-paginate-v2
$ npm i bcrypt
$ npm i jsonwebtoken
$ npm install cloudinary
$ npm i multer
$ npm i express-fileupload
```
* nodemon => start server automatically
* dotenv => all important / Secreat data here
* prettier => Code Prettier (-D => devDependencies)
- create .prettierrc (for configuration for impliment)
- create .prettierignore (for configuration for not impliment)
* cookie-parser => Parse Cookie header and populate req.cookies
* cors => cors origin 
* multer => file uploading
* mongoose-aggregate-paginate-v2 => If you are looking for basic query pagination library without aggregate
* bcrypt => password hashing
* jsonwebtoken =>An implementation of JSON Web Tokens.
* cloudinary => Thirdparty Service to store files
* express-fileupload => Simple express middleware for uploading files.
####  dotenv file load when server start
* package.json
```
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
  },
```


## Others
* .gitignore generator
https://mrkandreev.name/snippets/gitignore-generator/