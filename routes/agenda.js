import express from "express";
import APIConnection from "../models/APIConnection.js";

const router = express.Router();
let api;

router.get("/", async (req, res) => {
  api = new APIConnection(req.session.username, req.session.password);
  await api.login(req, res);
  agendaRedirect(res, req, await api.getAgenda(getWeekDays(new Date(Date.now()))), DateToString(new Date(Date.now())));
});

router.post("/", async (req, res) => {
  let selectedDate = new Date(Date.now());
  let selectedDateString = DateToString(selectedDate);
  if (req.body.dateTimePicker !== "") {
    selectedDate = APIConnection.stringToDate(YYYYMMDDToDDMMYYYY(req.body.dateTimePicker), 12, 0, 0);
    selectedDateString = req.body.dateTimePicker;
  }

  agendaRedirect(res, req, await api.getAgenda(getWeekDays(selectedDate)), selectedDateString);
});

const agendaRedirect = (res, req, agenda, date) => {
  if (agenda == null || agenda == NaN || agenda == undefined) {
    res.redirect("/login");
  } else {
    res.render("agenda", {
      datePicker: date,
      agenda: agenda,
      profile: req.session.profile,
      dateToday: YYYYMMDDToDDMMYYYY(DateToString(GetDateToday())),
    });
  }
};

const getWeekDays = (current) => {
  const week = [];
  current.setDate(current.getDate() - current.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const newDate = new Date(current);

    let dd = "";
    if (newDate.getDate() < 10) dd += "0";
    dd += newDate.getDate();

    let mm = "";
    if (newDate.getUTCMonth() + 1 < 10) mm += "0";
    mm += newDate.getUTCMonth() + 1;

    const yyyy = newDate.getUTCFullYear();

    const newDateTxt = `${dd}/${mm}/${yyyy}`;
    week.push(newDateTxt);
    current.setDate(current.getDate() + 1);
  }
  return week;
};

const DateToString = (date) => {
  let dateString = `${date.getUTCFullYear()}-`;
  if (date.getUTCMonth() + 1 < 10) dateString += "0";
  dateString += `${date.getUTCMonth() + 1}-`;
  if (date.getDate() < 10) dateString += "0";
  dateString += date.getDate();

  return dateString;
};

const GetDateToday = () => new Date();

const YYYYMMDDToDDMMYYYY = (text) => `${text.substring(8, 10)}/${text.substring(5, 7)}/${text.substring(0, 4)}`;

export default router;
