console.log("File index.js loaded successfully");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// app.use(express.static(__dirname + "/public"));
// app.use(express.static(__dirname));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/lab4",
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
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const taskSchema = new mongoose.Schema(
    {
        _id: Number,
        name: userSchema,
        owner: userSchema,
        creator: String,
        done: Boolean,
        cleared: Boolean
    });
taskSchema.plugin(passportLocalMongoose);
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


app.post("/register", function (request, response) {
    console.log("User submitted registration information");
    let emailInput = request.body.signupEmail;
    let passwordInput = request.body.signupPassword;
    User.register({ username: request.body.signupEmail }, request.body.signupPassword, function (err, user) {
        console.log("Registering user...");
        if (err) {
            console.log(err);
            response.redirect("/login");
        } else {
            passport.authenticate("local")(request, response, function () {
                response.redirect("/todo");
            });
        }
    });
    response.redirect("/login");
});

app.post("/login", function (request, response) {
    console.log("user submitted login information");
    let loginEmail = request.body.loginEmail;
    let loginPassword = request.body.loginPassword;
    let userToVerify = new User({
        username: loginEmail,
        password: loginPassword
    });
    request.login(userToVerify, function (err) {
        if (err) {
            console.log(err);
            response.redirect("/login");
        } else {
            passport.authenticate("local")(request, response, function () {
                response.redirect("/todo");
            });
        }
    });
});

app.get("/todo", function(request, response) {
    console.log("directed to route 'todo'");
    if (request.isAuthenticated()) {
        response.render("todo", {user: request.user.username});
    } else {
        response.redirect("/login");
    }
});

// app.post("/todo", function (request, response) {
//     console.log("directed to route 'todo'");
//     let standInTitle = "Stand-In Title";
//     let taskList = loadAllTaskData();
//     response.render("list", { title: standInTitle, username: request.query.username, tasks: taskList });
// });

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