const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const moment = require("moment");
const cron = require("node-cron");

const app = express();
const port = 3100;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.post("/api/logs", (req, res) => {
  if (!req.body) res.status(500).send("request body not found");
  const { robotId, data } = req.body;
  const filename = `${robotId}_${moment
    .utc()
    .format("YYYY-MM-DD_HH-mm-ss")}_UTC`;

  if (data.length <= 0)
    return res.status(500).json({ status: false, message: "empty array" });
  fs.writeFile(
    `./logs/${filename}.json`,
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ status: false });
      } else {
        res.status(200).json({ status: true });
      }
    }
  );
});

cron.schedule("*/30 * * * *", async () => {
  const logs = await fs.promises.readdir("./logs");
  const currentDate = moment.utc();
  for (const file of logs) {
    const splitFilename = file.split("_");
    const dataTimeString = splitFilename[1] + splitFilename[2];
    const dataTimeUTC = moment
      .utc(dataTimeString, "YYYY-MM-DD_HH-mm-ss")
      .toDate();
    const diffInDays = currentDate.diff(dataTimeUTC, "days");
    if (diffInDays >= 30) {
      await fs.promises.unlink(`./logs/${file}`);
    }
  }
});

app.listen(port, () => {
  console.log(`server starting on port ${port}`);
});
