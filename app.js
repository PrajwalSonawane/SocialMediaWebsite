const express = require('express'),
      path = require("path"),
      bodyParser = require('body-parser'),
      HomeRoutes = require("./routes/home"),
      UserRoutes = require("./routes/user"),
      db = require("./connection"),
      passport = require('passport'),
      LocalStrategy = require("passport-local").Strategy,
      session = require("express-session"),
      MySQLStore  = require("express-mysql-session")(session),
      flash = require("connect-flash"),
      cookieParser = require('cookie-parser'),
      methodOverride = require("method-override"),
      bcrypt = require("bcryptjs");
var app = express();
app.use(cookieParser());

const options = {
    host:'localhost',
    user:'root',
    password:'lawjarp',  // root password
    database:'socialmedia'
};

var sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store:sessionStore
}));

app.use(flash());

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

/// PASSPORT CONFIGURATION

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function(username, password, done) {
        db.query('SELECT * FROM users WHERE username = ? ', [username], async function(err, results){
            if(results.length > 0){
                const comparision = await bcrypt.compare(password, results[0].password);
                if(comparision){
                    done(null, results[0]);
                }else{
                    done(null, false);
                  }
            }else{
               done(null, false);
            }
        });
    }
));
passport.serializeUser((user, done)=>{
    done(null, user);
});

passport.deserializeUser((user, done)=>{
    done(null, user);
});

// ROUTES


app.use((req, res, next)=>{
	res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentuser = req.user;
	next();
});

app.use("/", HomeRoutes);
app.use("/profile", UserRoutes);

app.listen(3001, ()=>{
    console.log("Server startes on PORT 3001");
})
