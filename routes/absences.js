import express from "express";
import NodeCache from "node-cache";
import APIConnection from "../models/APIConnection.js";

const router = express.Router();
const cache = new NodeCache();

router.get("/", async (req, res) => {
  const cacheKey = "absences";
  let absences = cache.get(cacheKey);

  if (!absences) {
    const api = new APIConnection(req.session.username, req.session.password);
    await api.login(req, res);
    absences = await api.getAbsences();
    cache.set(cacheKey, absences);
  }

  if (!absences) {
    res.redirect("/agenda");
  } else {
    res.render("absences", {
      profile: req.session.profile,
      absences,
      yearAbsence: getYearAbsence(absences),
    });
  }
});

const getYearAbsence = (absences) => {
  const yearAbsence = [];
  for (const absence of absences) {
    const s = { year_name: `${absence.year} - ${absence.year + 1}`, year_id: absence.year * absence.year };
    if (!yearAbsence.some((e) => e.year_name === s.year_name && e.year_id === s.year_id)) {
      yearAbsence.push(s);
    }
  }
  return yearAbsence;
};

export default router;
