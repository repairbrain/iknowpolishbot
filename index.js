const express = require("express");
const expressApp = express();
const axios = require("axios");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");

const port = process.env.PORT || 3000;
expressApp.use(express.static("static"));
expressApp.use(express.json());
require("dotenv").config();

const DOMAIN = "https://iknowpolish.herokuapp.com";

const bot = new Telegraf(process.env.BOT_TOKEN);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

bot.command("start", (ctx) => {
  console.log(ctx.from);
  bot.telegram.sendMessage(
    ctx.chat.id,
    "Контекстуальный переводчик на польский язык.\n\nДля качественного перевода напишите фразу в формате: 'фраза-контекст',\nнапример: 'есть ли у Вас таблетки от гриппа?-в аптеке,вежливо'",
    {}
  );
});

// bot.command("ethereum", (ctx) => {
//   var rate;
//   console.log(ctx.from);
//   axios
//     .get(
//       `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
//     )
//     .then((response) => {
//       console.log(response.data);
//       rate = response.data.ethereum;
//       const message = `Hello, today the ethereum price is ${rate.usd}USD`;
//       bot.telegram.sendMessage(ctx.chat.id, message, {});
//     });
// });

bot.on(message("text"), async (ctx) => {
  const msgSplitted = ctx.update.message.text.split("-");
  const phrase = msgSplitted[0];
  const msgContext = msgSplitted[1];

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Translate this into Polish: ${phrase}.Use the context: ${msgContext}.Don't mention context phrases in the output,just for translation improvement`,
    temperature: 0.3,
    max_tokens: 100,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });
  console.log("completion.data", completion.data);

  await ctx.reply(completion.data.choices[0].text);
});

if (process.env.environment == "PRODUCTION") {
  expressApp.use(bot.webhookCallback("/secret-path"));
  bot.telegram.setWebhook(`${DOMAIN}/secret-path`);
} else {
  bot.launch();
}

expressApp.listen(port, () => console.log(`Listening on ${port}`));

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
