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
  const filename = `${robotId}_${moment.utc().format("YYYY-MM-DD")}_UTC`;

  if (data.length <= 0)
    return res.status(500).json({ status: false, message: "empty array" });

  if (fs.existsSync(`./logs/${filename}.json`)) {
    // const extractedObjects = data.flatMap(obj => obj);
    // const jsonString = extractedObjects.map(obj => JSON.stringify(obj, null, 2)).join(",\n");

    const origin = fs.readFileSync(`./logs/${filename}.json`, `utf8`);
    const originJson = JSON.parse(origin);

    const mergedData = originJson.concat(data);
    try {
      fs.writeFileSync(
        `./logs/${filename}.json`,
        JSON.stringify(mergedData, null, 2)
      );
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
    res.status(200).json({ status: true });
  } else {
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
  }
});

cron.schedule("*/30 * * * *", async () => {  // */30 * * * *
  const logs = await fs.promises.readdir("./logs");
  const currentDate = moment.utc();
  for (const file of logs) {
    const splitFilename = file.split("_");
    const dataString = splitFilename[1];
    const diffInDays = currentDate.diff(dataString, "days");
    if (diffInDays >= 30) {
      await fs.promises.unlink(`./logs/${file}`);
    }
  }
});

function init() {
  if (!fs.existsSync("./logs")) {
    fs.mkdir("./logs", (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("logs folder created successfully.");
      }
    });
  }
}

app.listen(port, async () => {
  console.log(`server starting on port ${port}`);
  await init();
});
