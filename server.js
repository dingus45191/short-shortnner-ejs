const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const ShortUrl = require("./models/shortUrl");
const app = express();
const bcrypt = require("bcrypt");
const Auth = require("./models/users");
const { name } = require("ejs");

//auth config

var passport = require("passport");
var GitHubStrategy = require("passport-github2").Strategy;

//connecting to mongodb

mongoose.connect(
    "mongodb://Mubashir:y4gQEVGPQKq0gQ9c@cluster0-shard-00-00.x4m8k.mongodb.net:27017,cluster0-shard-00-01.x4m8k.mongodb.net:27017,cluster0-shard-00-02.x4m8k.mongodb.net:27017/shortnner?ssl=true&replicaSet=atlas-en1n15-shard-0&authSource=admin&retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.get("/", async(req, res) => {
    const shortUrls = await ShortUrl.find();
    res.render("index", { shortUrls: shortUrls });
});

app.set("views", __dirname + "/views");
app.engine("html", require("ejs").renderFile);

app.get("/auth", (req, res) => {
    res.render("auth.html");
});


passport.use(
    new GitHubStrategy({
            clientID: "e24a3ac1874eb843555e",
            clientSecret: "f93532099cc9ea7a254d3763fc85bf3e76933810",
            callbackURL: "http://localhost:3000/auth/github/callback",
        },
        function(accessToken, refreshToken, profile, done) {
      
            console.log(profile);
                done(null, profile.id);


        }
    )
)
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get(
    "/auth/github/",
    passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect("/");
    }
);


app.post("/shortUrls", async(req, res) => {
    await ShortUrl.create({ full: req.body.fullUrl });

    res.redirect("/");
});

app.get("/:shortUrl", async(req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
    if (shortUrl === null) {
        return res.sendStatus(404);
    }

    shortUrl.clicks++;
    shortUrl.save();

    res.redirect(shortUrl.full);
});

app.listen(process.env.PORT || 3000, () => console.log("running at 3000 port"));
