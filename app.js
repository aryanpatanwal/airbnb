const path = require('path');
const express = require('express');
const session = require('express-session');
const { default: mongoose } = require('mongoose');

const multer = require('multer');

const MongoDBStore = require('connect-mongodb-session')(session);
const DB_PATH = "mongodb+srv://aryanpatanwal:Skywalker%40124@cluster0.n9jui1t.mongodb.net/airbnb?retryWrites=true&w=majority&appName=Cluster0";
//Local module
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const rootDir = require("./utils/pathUtil");
const authRouter = require('./routes/authRouter');
const errorsController = require('./controllers/errors');



const app = express();

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
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store
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

mongoose.connect(DB_PATH).then(()=>{
  app.listen(PORT,()=>{
  });
}).catch(err =>{
})