import moment from "moment";
import myges from "myges";
import { decrypt, encrypt } from "../crypto.js";

class APIConnection {
  username;
  password;
  api;

  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  login = async (req, res) => {
    let loginOK = false;
    let error;
    if (req.cookies && req.cookies["MygesBearerToken"]) {
      try {
        let ApiToken = JSON.parse(decrypt(req.cookies["MygesBearerToken"], this.password));
        if (ApiToken.credentials?.expires_in && Date.now() < ApiToken.credentials.expires_in) {
          this.api = new myges.GesAPI(ApiToken.credentials);
          loginOK = true;
        }
      } catch (error) {
        console.log(`APIConnection Parse ApiToken: ${error}`);
      }
    }
    if (!loginOK) {
      try {
        this.api = await myges.GesAPI.login(this.username, this.password);
        let expires_in = parseInt(this.api.credentials.expires_in, 10) * 1000;
        this.api.credentials.expires_in = (Date.now() + expires_in).toString();
        res.cookie("MygesBearerToken", encrypt(JSON.stringify(this.api), this.password), {
          sameSite: "none",
          secure: true,
        });
      } catch (err) {
        console.log(`APIConnection login: ${err}`);
        error = err;
      }
    }
    return error;
  };

  getGrades = async () => {
    let notes = [];
    let years = 0;
    try {
      years = await this.api.getYears();
    } catch (error) {
      console.log(`APIConnection getYears: ${error}`);
    }
    for (const year of years) {
      try {
        notes.push(await this.api.getGrades(year));
      } catch (error) {
        console.log(`APIConnection getGrades: ${error}`);
      }
    }
    if (notes.length > 0) {
      for (let note of notes) {
        note.sort((a, b) => (a.course > b.course ? 1 : b.course > a.course ? -1 : 0));
        note.sort((a, b) => b.trimester - a.trimester);
      }
    }
    return notes;
  };

  getAbsences = async () => {
    let apiAbsences = [];
    let years = [];
    let absencesArray = [];
    try {
      years = await this.api.getYears();
    } catch (error) {
      console.log(`APIConnection getYears: ${error}`);
    }

    if (years.length > 0) {
      for (const year of years) {
        try {
          apiAbsences.push(await this.api.getAbsences(year));
        } catch (error) {
          console.log(`APIConnection getAbsences: ${error}`);
        }
      }

      for (const years of apiAbsences) {
        if (years != undefined) {
          for (var absence of years) {
            let data = {
              date: moment(absence.date).locale("fr").format("DD/MM/YYYY, HH:mm:ss"),
              course_name: absence.course_name,
              trimester: absence.trimester_name,
              year: absence.year,
              justified: absence.justified,
            };
            absencesArray.push(data);
          }
        }
      }
    }

    return absencesArray;
  };

  getAgenda = async (week) => {
    let firstDayDate = APIConnection.stringToDate(this.getWeekFirstDay(week), 0, 0, 0);
    let lastDayDate = APIConnection.stringToDate(this.getWeekLastDay(week), 23, 59, 59);
    let lessons = [];

    try {
      lessons = await this.api.getAgenda(firstDayDate, lastDayDate);
    } catch (error) {
      console.log(`APIConnection getAgenda: ${error}`);
    }

    let agenda = {};

    week.forEach((element) => (agenda[element] = []));

    for (var lesson in lessons) {
      var data = {
        start_date: moment(lessons[lesson].start_date).locale("fr").format("DD/MM/YYYY, HH:mm:ss"),
        end_date: moment(lessons[lesson].end_date).locale("fr").format("DD/MM/YYYY, HH:mm:ss"),
        name: lessons[lesson].name,
        teacher: lessons[lesson].teacher,
      };

      if (lessons[lesson].rooms) {
        data.room = lessons[lesson].rooms[0].name;
        data.floor = lessons[lesson].rooms[0].floor;
        data.campus = lessons[lesson].rooms[0].campus;
      } else {
        data.room = "";
        data.floor = "";
        data.campus = "";
      }

      if (lessons[lesson].hasOwnProperty("modality")) {
        data.modality = lessons[lesson].modality;
      } else {
        data.modality = "";
      }

      if (data.modality == "Présentiel") {
        data.color = "var(--cd-color-event-1)";
      } else {
        data.color = "var(--cd-color-event-5)";
      }
      let valideAgenda = agenda[data.start_date.substring(0, 10)];
      if (valideAgenda != null || valideAgenda || (NaN && valideAgenda) || undefined) {
        agenda[data.start_date.substring(0, 10)].push(data);
      }
    }

    for (var date in agenda) {
      agenda[date] = agenda[date].sort((a, b) => {
        if (a.start_date.substring(12, 14) == b.start_date.substring(12, 14))
          return a.start_date.substring(15, 17) - b.start_date.substring(15, 17);
        return a.start_date.substring(12, 14) - b.start_date.substring(12, 14);
      });
    }
    return agenda;
  };

  getProfile = async () => {
    try {
      return await this.api.getProfile();
    } catch (error) {
      console.log(`APIConnection getProfile: ${error}`);
    }
  };

  static stringToDate(text, hours, minutes, seconds) {
    var date = new Date("2000-01-01");
    date.setUTCFullYear(text.substring(6, 10));
    date.setMonth(text.substring(3, 5) - 1);
    date.setDate(text.substring(0, 2));
    date.setUTCHours(hours);
    date.setUTCMinutes(minutes);
    date.setUTCSeconds(seconds);
    date.setUTCMilliseconds(0);
    return date;
  }

  getWeekFirstDay(weekTextArray) {
    return weekTextArray[0];
  }

  getWeekLastDay(weekTextArray) {
    return weekTextArray[weekTextArray.length - 1];
  }

  getYear() {
    const CurrentDate = new Date();
    return CurrentDate.getMonth() < 8 ? CurrentDate.getFullYear() - 1 : CurrentDate.getFullYear();
  }
}

export default APIConnection;
