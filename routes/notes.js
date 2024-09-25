import express from "express";
import NodeCache from "node-cache";
import APIConnection from "../models/APIConnection.js";

const router = express.Router();
const cache = new NodeCache();

router.get("/", async (req, res) => {
  const cacheKey = "notes";
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.render("notes", {
      profile: req.session.profile,
      notes: cachedData.notes,
      semesters: cachedData.semesters,
    });
  } else {
    const api = new APIConnection(req.session.username, req.session.password);
    await api.login(req, res);

    const grades = await api.getGrades();

    if (grades.length === 0) {
      res.redirect("/agenda");
    } else {
      const semesters = getSemesters(grades);
      const dataToCache = { notes: grades, semesters };
      cache.set(cacheKey, dataToCache);

      res.render("notes", {
        profile: req.session.profile,
        notes: grades,
        semesters,
      });
    }
  }
});

const getSemesters = (grades) => {
  const semesters = [];
  for (const grade of grades) {
    for (const course of grade) {
      const s = { semester_name: `${course.year} - ${course.trimester_name}`, semester_id: course.year * course.trimester };
      if (semesters.filter((e) => e.semester_name === s.semester_name && e.semester_id === s.semester_id).length === 0) {
        semesters.push(s);
      }
    }
  }
  return semesters;
};

export default router;
