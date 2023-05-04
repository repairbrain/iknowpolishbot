const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");

const bot = new Telegraf(functions.config().telegram.token, {
  telegram: { webhookReply: true },
});

const configuration = new Configuration({
  apiKey: functions.config().openai.apikey,
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

  await ctx.reply(completion.data.choices[0].text);
});

exports.iknowpolishbot = functions
  .region("europe-west1")
  .https.onRequest((request, response) => {
    functions.logger.log("Incoming message", request.body);
    bot.handleUpdate(request.body, response);
  });
