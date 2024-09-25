import express from "express";
import APIConnection from "../models/APIConnection.js";

const router = express.Router();
let upToDate = true;

router.get("/", async (req, res) => {
  res.render("login", {
    upToDate: true,
    error: "",
  });
});

router.post("/", async (req, res) => {
  try {
    req.session.connected = true;
    req.session.username = req.body.username.split("@")[0];
    req.session.password = req.body.password;

    const api = new APIConnection(req.session.username, req.session.password);
    const error = await api.login(req, res);

    if (api.api !== undefined) {
      req.session.profile = await api.getProfile();

      console.log(`New user connected: ${req.session.username}`);
      res.redirect("/agenda");
    } else {
      endLogin(req, res, error);
    }
  } catch (err) {
    endLogin(req, res, err);
  }
});

function endLogin(req, res, error) {
  if (req.session) {
    req.session.destroy();
  }

  res.clearCookie("connect.sid");
  res.clearCookie("MygesBearerToken");
  res.render("login", {
    upToDate,
    error,
  });
}

export default router;
