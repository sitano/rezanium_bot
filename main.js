import './env.js';
import doc from './document.js';

const BOT_TOKEN = process.env.BOT_TOKEN;

import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

console.log('Bot started');

const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome! Type /help to see available commands.'))
bot.help((ctx) => ctx.reply("Send me a sticker or say hi,\n\
Or type /debt to get your balance,\n\
Or type /id to get your Telegram ID."))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('id', (ctx) => {
  const id = ctx.from.id;
  const nick = ctx.from.username;
  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name;
  ctx.reply(`You are: ${id} / ${nick}, ${firstName} ${lastName}`);
});

bot.command('debt', async (ctx) => {
  var text = '';

  const nick = ctx.from.username;

  try {
    const val = await doc.getDebt(nick);

    if (val < 0) {
      text = `Долг ${val} на дату ${doc.getMonthDate()}`;
    } else if (val > 0) {
      text = `Переплата ${val} на дату ${doc.getMonthDate()}`;
    } else {
      text = `Долгов нет на дату ${doc.getMonthDate()}`;
    }
  } catch (err) {
    console.error(`Error getting debt for ${nick}:`, err);
    text = `Возникла ошибка при получении долга для ${nick}`;
  };

  ctx.reply(text);
});

await doc.loadMaps();

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))