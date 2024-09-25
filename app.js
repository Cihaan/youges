import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import path from "path";

import { fileURLToPath } from "url";

import absencesRouter from "./routes/absences.js";
import agendaRouter from "./routes/agenda.js";
import loginRouter from "./routes/login.js";
import notesRouter from "./routes/notes.js";

const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checkLoggedIn = async (req, res, next) => {
  if (req.session.connected && req.session.username !== "" && req.session.password !== "") {
    next();
  } else {
    res.redirect("/login");
  }
};

const logout = (req, res, next) => {
  req.session.destroy();
  res.clearCookie("connect.sid");
  res.clearCookie("MygesBearerToken");
  res.redirect("/login");
  res.end();
};

const app = express();
app.use(express.static("public"));
// app.set("views", path.join(__dirname, "views"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.use("/healthz", (req, res) => {
  res.sendStatus(200);
});

app.use("/login", loginRouter);
app.use("/logout", logout, loginRouter);
app.use("/", checkLoggedIn, agendaRouter);
app.use("/index", checkLoggedIn, agendaRouter);
app.use("/agenda", checkLoggedIn, agendaRouter);
app.use("/absences", checkLoggedIn, absencesRouter);
app.use("/notes", checkLoggedIn, notesRouter);

app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));
