const Home = require("../models/home");
const fs = require('fs');

exports.getAddHome = (req,res,next)=>{
  res.render('host/edit-home',{pageTitle: 'Add Home to airbnb',currentPage: 'addHome',editing:false,
    isLoggedIn: req.isLoggedIn ,user: req.session.user
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId).then((home) => {
    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  });
};

exports.getHostHomes = (req, res, next) => {
  Home.find().then((registeredHomes) =>{
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user
    })
  });
};
exports.postAddHome = (req,res,next)=>{
  const {houseName,price,location,rating,description} = req.body;
  if(!req.file) {
    return res.status(422).send("No file uploaded");
  }

  const photo = req.file.path; 

  const home = new Home({houseName,price,location,rating,photo,description});
  home.save().then(()=>{
  });
  res.redirect('/host/host-home-list');
};
exports.postEditHome = (req,res,next)=>{
  const {id,houseName,price,location,rating,description} = req.body;
  Home.findById(id).then((home)=>{
    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    if(req.file){
      fs.unlink(home.photo, (err) => {
        if (err) {
          console.error("Error deleting old photo:", err);
        }
      });
      home.photo = req.file.path; 
    }

    home.save().then((result) =>{
    }).catch(err =>{
    })
    res.redirect("/host/host-home-list");
  }).catch(err =>{
  });
};
exports.postDeleteHome = (req,res,next)=>{
  const homeId = req.params.homeId;
  Home.findByIdAndDelete(homeId).then(() =>{
    res.redirect('/host/host-home-list');
  }).catch(error =>{
  })
};


 