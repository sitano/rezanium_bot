import './env.js';
import doc from './document.js';

const BOT_TOKEN = process.env.BOT_TOKEN;

import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

console.log('Bot started');

const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker. Or type /debt to know your debt.'))
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
  const nick = ctx.from.username;
  const val = await doc.getDebt(nick);

  var text = '';

  if (val < 0) {
    text = `Долг ${val} на дату ${doc.monthDate}`;
  } else if (val > 0) {
    text = `Переплата ${val} на дату ${doc.monthDate}`;
  } else {
    text = `Долгов нет на дату ${doc.monthDate}`;
  }

  ctx.reply(text);
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))