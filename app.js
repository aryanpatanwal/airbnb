require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

const MongoDBStore = require('connect-mongodb-session')(session);
const DB_PATH = process.env.MONGODB_URI;
//Local module
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const rootDir = require("./utils/pathUtil");
const authRouter = require('./routes/authRouter');
const errorsController = require('./controllers/errors');



const app = express();


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:"],
      "script-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression()); 

app.set('view engine','ejs');
app.set('views','views');

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

const randomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const multerOptions = {
  storage,
  fileFilter
};

app.use(express.urlencoded());
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir,'public')));
app.use("/uploads", express.static(path.join(rootDir,'uploads')));
app.use("/host/uploads", express.static(path.join(rootDir,'uploads')));
app.use("/homes/uploads", express.static(path.join(rootDir,'uploads')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, 
  store,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 1000 * 60 * 60 * 24 * 7, 
    httpOnly: true
  }
}));
app.use((req,res,next) =>{
  req.isLoggedIn = req.session.isLoggedIn;
  next();  
});

app.use(storeRouter);
app.use(authRouter);
app.use("/host",(req,res,next) =>{
  if(req.isLoggedIn){
    next();
  }else{
    res.redirect("/login");
  }
});
app.use("/host",hostRouter);


app.use(errorsController.pageNotFound);
const PORT = process.env.PORT ||3000;


mongoose.connect(DB_PATH)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on address http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });