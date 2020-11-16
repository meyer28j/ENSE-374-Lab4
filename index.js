console.log("File index.js loaded successfully");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/usersDB",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

const userSchema = new mongoose.Schema(
    {
        username: String,
        password: String
    });
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const taskSchema = new mongoose.Schema(
    {
        _id: Number,
        name: String,
        //owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        owner: String,
        //creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        creator: String,
        done: Boolean,
        cleared: Boolean
    });
const Task = mongoose.model("Task", taskSchema);

const port = 3000;
app.listen(port, function () {
    console.log("Server is running on port: " + port);
});

app.get("/", function (request, response) {
    response.redirect("/login");
});

app.get("/login", function (request, response) {
    console.log("directed to route 'login'");
    response.render("login");
});

app.post("/register", function(req, res) {
    console.log("Registering a new user");
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/login")
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/todo")
            });
        }
    });
});

app.post("/login", function(req, res) {
    console.log("A user is logging in")
    // create a user
    const user = new User ({
        username: req.body.username,
        password: req.body.password
     });
     // try to log them in
    req.login (user, function(err) {
        if (err) {
            // failure
            console.log(err);
            res.redirect("/")
        } else {
            // success
            passport.authenticate("local")(req, res, function() {
                res.redirect("/todo"); 
            });
        }
    });
});


app.get("/todo", function (request, response) {
    console.log("directed to route 'todo'");
    if (request.isAuthenticated()) {
        let allTasks = Task.find();
        console.log("allTasks: " + allTasks);
        for (task of allTasks) {
        console.log("task: " + task);
        }
        //response.render("todo", { username: request.user.username, tasks: allTasks });
    } else {
        response.redirect("/login");
    }
});

app.post("/todo", function (request, response) {
    response.redirect("/todo");
});

app.get("/logout", function (request, response) {
    console.log("user has logged out");
    request.logout();
    response.redirect("/login");
});

// BUG: name and Id aren't retrieved from form
app.post("/addTask", function (request, response) {
    console.log("directed to route 'addTask'");
    let id = request.body.taskId;
    console.log("request.body: " + JSON.stringify(request.body));
    console.log("new id: " + id);
    let nameInput = request.body.newTask;
    console.log("new name: " + nameInput);
    let owner = request.body.creator;
    console.log("new owner: " + owner);
    let creator = owner;
    let newTask = new Task(id, nameInput, owner, creator, false, false);
    //let newTask = new Task(6, "newTask", "admin", "admin", false, false);
    console.log("newTask: " + JSON.stringify(newTask));
    // appendToTasks(newTask);
    response.redirect(307, "/todo?username=" + owner);
});

app.post("/claim", function (request, response) {
    console.log("directed to route '/claim'");

    response.redirect(307, "/todo");
});

app.post("abandonOrComplete", function (request, response) {
    console.log("directed to route '/abandonOrComplete'");

    response.redirect(307, "/todo");
});

app.post("unfinish", function (request, response) {
    console.log("directed to route '/unfinish'");
    let taskChecked = request.body.taskId;
    console.log("task being checked: " + taskChecked);
    let taskId = taskChecked[taskChecked.search(/\d+/)];
    setTaskUnfinished(taskChecked);

    response.redirect(307, "/todo");
});
app.post("purge", function (request, response) {
    console.log("directed to route '/purge'");

    response.redirect(307, "/todo");
});