const express = require("express");
const expressApp = express();
const axios = require("axios");
const path = require("path");
const port = process.env.PORT || 3000;
expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("start", (ctx) => {
  console.log(ctx.from);
  bot.telegram.sendMessage(
    ctx.chat.id,
    "Hello there! Welcome to the Code Capsules telegram bot.\nI respond to /ethereum. Please try it",
    {}
  );
});

bot.command("ethereum", (ctx) => {
  var rate;
  console.log(ctx.from);
  axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
    )
    .then((response) => {
      console.log(response.data);
      rate = response.data.ethereum;
      const message = `Hello, today the ethereum price is ${rate.usd}USD`;
      bot.telegram.sendMessage(ctx.chat.id, message, {});
    });
});

if (process.env.environment == "PRODUCTION") {
  expressApp.use(bot.webhookCallback("/secret-path"));
  bot.telegram.setWebhook("https://iknowpolish.herokuapp.com/secret-path");
} else {
  bot.launch();
}

expressApp.listen(port, () => console.log(`Listening on ${port}`));
