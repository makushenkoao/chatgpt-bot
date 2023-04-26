import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { code } from "telegraf/format";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

const INITIAL_SESSION = {
  messages: [],
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command("new chat", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "Ас-саляму алейкум, братан! Напиши мне шо нибудь, если лень - запиши голосовое!"
  );
});

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "Ас-саляму алейкум, братан! Напиши мне шо нибудь, если лень - запиши голосовое!"
  );
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  await ctx.reply(code("Ееее брад, я тебя слышу! Ща все будет!"));
  const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
  const userId = String(ctx.message.from.id);
  const oogPath = await ogg.create(link.href, userId);
  const mp3Path = await ogg.toMp3(oogPath, userId);
  const text = await openai.transcription(mp3Path);
  await ctx.reply(code(`Еееу йо, твой запрос: ${text}`));
  ctx.session.messages.push({ role: openai.roles.USER, content: text });
  const response = await openai.chat(ctx.session.messages);
  ctx.session.messages.push({
    role: openai.roles.ASSISTANT,
    content: response.content,
  });
  await ctx.reply(response.content);
  try {
  } catch (e) {
    console.log("Error while voice message", e.message);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  await ctx.reply(code("Ееее брад, я тебя слышу! Ща все будет!"));
  ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });
  const response = await openai.chat(ctx.session.messages);
  ctx.session.messages.push({
    role: openai.roles.ASSISTANT,
    content: response.content,
  });
  await ctx.reply(response.content);
  try {
  } catch (e) {
    console.log("Error while voice message", e.message);
  }
});

bot.launch().then(() => console.log("Bot started"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
