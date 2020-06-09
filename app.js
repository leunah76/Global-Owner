require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("cookie-session");
//const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: "Thisismylittlesecret",
  resave: false,
  saveUninitialized: false,
  cookie:{secure:true}
}))
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb+srv://admin-eunah:Test123@cluster0-8z2qp.mongodb.net/globalownerDB",
         {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

let loggedUser = null;
// Rendering home page
app.get("/", function(req,res){
  if (req.isAuthenticated()) {
    res.render("home", {status: true});
  } else {
    res.render("home", {status: false});
  }
})

// Rendering asset page
const buysellinfoSchema =
{
    "country" : String,
    "buyer" : {
       "stampDuty" : String,
       "transferTax" : String,
       "legalFee" : String,
       "agentFee" : String,
       "rentalTax" : String,
       "propertyTax" : String,
       "cgt" : String
     },
     "seller" : {
       "stampDuty" : [
             String
           ],
       "transferTax" : String,
       "legalFee" : String,
       "agentFee" : String,
       "rentalTax" : String,
       "propertyTax" : String,
       "cgt" : String
     },
     "bank" : {
       "name" : String,
       "document" : [String],
       "minBalance" : [String],
       "monthlyFee" : [String]
     }
}

const Buysellinfo = mongoose.model("Buysellinfo", buysellinfoSchema);

app.get("/countryinfo", function(req,res){
  if (req.isAuthenticated()) {
    Buysellinfo.find(function(err, buysellinfos){
      if(!err) {
          res.render("countryinfo", {status: true, buysellinfos: buysellinfos});
      }
    })
  } else {
    Buysellinfo.find(function(err, buysellinfos){
      if(!err) {
          res.render("countryinfo", {status: false, buysellinfos: buysellinfos});
      }
    })
  }
})

/* Registration page */
const userSchema = new mongoose.Schema ({
  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/register", function(req,res){
  res.render("register");
})

app.post("/register", function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      res.send(err);
      res.redirect("/register");
    } else {
        passport.authenticate("local") (req, res, function() {
        res.redirect("/login");
      })
    }
  })
})

app.get("/login", function(req,res){
  res.render("login");
})

app.post("/login", function(req,res){
  if (!req.body.username) {
    res.send("must provide email");
  } else if (!req.body.password) {
    res.send("must provide password");
  }
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, function(err) {
    if (err) {
      res.send(err);
    } else {
      passport.authenticate("local") (req, res, function() {
          loggedUser = user.username;
          res.redirect("/mypage");
      })
    }
  })
})

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
})

// Rendering mypage page
const mypropertySchema =
{
    "user" : String,
    "country" : String,
    "currency" : String,
    "propertyName" : String,
    "address" : String,
    "type" : String,
    "size" : Number,
    "purchaseDate" : String,
    "purchaseValue" : Number,
    "registration" : String,
    "annualValue" : Number,
    "propertyTax" : Number,
    "occupancy" : String,
    "tenantName" : String,
    "tenantPhone" : String,
    "contractStart" : String,
    "contractEnd" : String,
    "rent" : Number,
    "deposit" : Number,
    "ownerAgencyName" : String,
    "ownerAgencyNum" : String,
    "ownerAgencyPhone" : String,
    "ownerAgentName" : String,
    "ownerAgentPhone" : String,
    "otherAgencyName" : String,
    "otherAgencyNum" : String,
    "otherAgencyPhone" : String,
    "otherAgentName" : String,
    "otherAgentPhone" : String
}

const Myproperty = mongoose.model("Myproperty", mypropertySchema);

app.get("/mypage", function(req,res){
  if (req.isAuthenticated()) {
    Myproperty.find({user: loggedUser}, function(err, myproperties){
      if(!err) {
          res.render("mypage", {myproperties: myproperties});
      }
    })
  } else {
    res.redirect("/login");
  }
})

app.post("/mypage", function(req,res){
  const updatePropertyId = req.body.updatebtn;
  const deletePropertyId = req.body.deletebtn;
  const sellPropertyId = req.body.sellbtn;
  if (req.isAuthenticated()) {
    if (updatePropertyId != null) {
      Myproperty.findById(updatePropertyId, function(err, foundProperty){
       if(!err) {
           res.render("update", {updateProperty: foundProperty});
       }
     })
    }
    else if (deletePropertyId != null) {
      Myproperty.findByIdAndRemove(deletePropertyId, function(err){
       if(!err) {
           res.redirect("/mypage");
       }
     })
    }
    else if (sellPropertyId != null) {
      Myproperty.findById(sellPropertyId, function(err, foundProperty){
        if(!err) {
          res.render("sell", {sellProperty: foundProperty});
        }
      })
    }

  } else {
    res.redirect("/login");
  }
})

// rendering add page
app.get("/add", function(req,res){
  if (req.isAuthenticated()) {
    res.render("add");
  } else {
    res.redirect("/login");
  }
})

app.post("/add", function(req,res){
  if (req.isAuthenticated()) {
    const property = new Myproperty({
      user: loggedUser,
      country: req.body.country,
      currency: req.body.currency,
      propertyName: req.body.propertyName,
      address: req.body.address,
      type: req.body.type,
      size: req.body.size,
      purchaseDate: req.body.purchaseDate,
      purchaseValue: req.body.purchaseValue,
      registration: req.body.registration,
      annualValue: req.body.annualValue,
      propertyTax: req.body.propertyTax,
      occupancy: req.body.occupancy,
      tenantName: req.body.tenantName,
      tenantPhone: req.body.tenantPhone,
      contractStart: req.body.contractStart,
      contractEnd: req.body.contractEnd,
      rent:  req.body.rent,
      deposit: req.body.deposit,
      ownerAgencyName: req.body.ownerAgencyName,
      ownerAgencyNum: req.body.ownerAgencyNum,
      ownerAgencyPhone: req.body.ownerAgencyPhone,
      ownerAgentName: req.body.ownerAgentName,
      ownerAgentPhone: req.body.ownerAgentPhone,
      otherAgencyName: req.body.otherAgencyName,
      otherAgencyNum: req.body.otherAgencyNum,
      otherAgencyPhone: req.body.otherAgencyPhone,
      otherAgentName: req.body.otherAgentName,
      otherAgentPhone: req.body.otherAgentPhone
    });
    property.save(function(err){
      if (!err) {
        res.redirect("/mypage")
      }
    });
  } else {
    res.redirect("/login");
  }
});

// rendering update page
app.post("/update", function(req,res){
  const updatePropertyId = req.body.updatebtn;
  const property = {
    user: loggedUser,
    country: req.body.country,
    currency: req.body.currency,
    propertyName: req.body.propertyName,
    address: req.body.address,
    type: req.body.type,
    size: req.body.size,
    purchaseDate: req.body.purchaseDate,
    purchaseValue: req.body.purchaseValue,
    registration: req.body.registration,
    annualValue: req.body.annualValue,
    propertyTax: req.body.propertyTax,
    occupancy: req.body.occupancy,
    tenantName: req.body.tenantName,
    tenantPhone: req.body.tenantPhone,
    contractStart: req.body.contractStart,
    contractEnd: req.body.contractEnd,
    rent:  req.body.rent,
    deposit: req.body.deposit,
    ownerAgencyName: req.body.ownerAgencyName,
    ownerAgencyNum: req.body.ownerAgencyNum,
    ownerAgencyPhone: req.body.ownerAgencyPhone,
    ownerAgentName: req.body.ownerAgentName,
    ownerAgentPhone: req.body.ownerAgentPhone,
    otherAgencyName: req.body.otherAgencyName,
    otherAgencyNum: req.body.otherAgencyNum,
    otherAgencyPhone: req.body.otherAgencyPhone,
    otherAgentName: req.body.otherAgentName,
    otherAgentPhone: req.body.otherAgentPhone
  };
  if (req.isAuthenticated()) {
      Myproperty.findOneAndUpdate({_id: updatePropertyId}, property, {new: true}, function(err){
       if(!err) {
           res.redirect("/mypage");
       }
     })

  } else {
    res.redirect("/login");
  }
});

// rendering update page
app.post("/delete", function(req,res){
  const updatePropertyId = req.body.updatebtn;
  if (req.isAuthenticated()) {
      Myproperty.findOneAndUpdate({_id: updatePropertyId}, property, {new: true}, function(err){
       if(!err) {
           res.redirect("/mypage");
       }
     })

  } else {
    res.redirect("/login");
  }
});

// rendering sell page
const costinfoSchema =
{
    "country" : String,
    "buyerStampDuty" : Number,
    "buyerTransferTax" : Number,
    "buyerLegalFee" : Number,
    "buyerAgentFee" : Number,
    "rentalTax" : Number,
    "propertyTax" : Number,
    "sellerStampDuty" : Number,
    "sellerStampDuty1" : Number,
    "sellerStampDuty2" : Number,
    "sellerStampDuty3" : Number,
    "sellerTransferTax" : Number,
    "sellerLegalFee" : Number,
    "sellerAgentFee" : Number,
    "cgt" : Number,
    "cgt1" : Number,
    "cgt2" : Number
}

const Costinfo = mongoose.model("costinfo", costinfoSchema);

app.post("/sell", function(req,res){
  if (req.isAuthenticated()) {
    const sellPropertyId = req.body.sellbtn;
    const sellPrice = req.body.sellPrice;

  Myproperty.findById(sellPropertyId, function(err, foundProperty){
     if(!err) {
         const sellCountry = foundProperty.country;
         const currency = foundProperty.currency;
         const propertyName = foundProperty.propertyName;
         const purchaseValue = foundProperty.purchaseValue;
         const costs = [];

         Costinfo.findOne({country : sellCountry}, function(err, foundCountry){
              const buyerStampDuty = foundCountry.buyerStampDuty * 0.01 * purchaseValue;
              const buyerLegalFee = foundCountry.buyerLegalFee * 0.01 * purchaseValue;
              const buyerAgentFee = foundCountry.buyerAgentFee * 0.01 * purchaseValue;
              const buyerTax = foundCountry.buyerTransferTax * 0.01 * purchaseValue;
              const sellerStampDuty = foundCountry.sellerStampDuty * 0.01 * sellPrice;
              const sellerLegalFee = foundCountry.sellerLegalFee * 0.01 * sellPrice;
              const sellerAgentFee = foundCountry.sellerAgentFee * 0.01 * sellPrice;
              const sellerTax = foundCountry.sellerTransferTax * 0.01 * sellPrice + foundCountry.cgt * 0.01 * (sellPrice-purchaseValue);
              costs.push(buyerStampDuty);
              costs.push(buyerLegalFee);
              costs.push(buyerAgentFee);
              costs.push(buyerTax);
              costs.push(sellerStampDuty);
              costs.push(sellerLegalFee);
              costs.push(sellerAgentFee);
              costs.push(sellerTax);
              res.render("sold", {propertyName: propertyName, sellPrice: sellPrice, purchaseValue: purchaseValue, costs: costs, currency: currency});
          })
     }
   })
  } else {
    res.redirect("/login");
  }
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server is running successfully");
});
