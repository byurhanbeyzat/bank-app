const session = require('express-session')
const bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')

const { store } = require('./redis')

const app = express()

const dev = process.env.NODE_ENV === 'development'

app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use((req, _, next) => {
  const { authorization } = req.headers

  if (authorization) {
    console.log(authorization)

    const token = authorization.split(' ')[1]
    req.headers.cookie = `${process.env.SESS_NAME}=${token}`
  }

  return next()
})

app.use(
  cors({
    origin: process.env.FRONTEND_URL || `http://localhost:3000`,
    credentials: true,
  }),
)

app.use(
  session({
    store,
    name: process.env.SESS_NAME,
    secret: process.env.SESS_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      secure: !dev,
      httpOnly: true,
      domain: !dev && process.env.SESS_DOMAIN,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
)

// Handle redis connection lost
app.use((req, _, next) => {
  if (!req.session) {
    return next(new Error('Redis connection lost!'))
  }
  return next()
})

exports.app = app
