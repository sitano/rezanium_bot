import './env.js';
import doc from './document.js';

const BOT_TOKEN = process.env.BOT_TOKEN;
const BANK_ACCOUNT_INFO = process.env.BANK_ACCOUNT_INFO;

import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';

console.log('Bot started');

const bot = new Telegraf(BOT_TOKEN)

bot.telegram.setMyCommands([
  { command: 'help', description: 'Get help information' },
  { command: 'debt', description: 'Get your coffee subscription debt' },
  { command: 'req', description: 'Get bank account info' },
]);

bot.start(async (ctx) => {
  await ctx.setChatMenuButton(JSON.stringify({
    type: 'default',
  }));
  ctx.reply('Welcome! Type /help to see available commands.', menu())
});
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

bot.command('req', (ctx) => {
  const text = `Реквизиты для перевода средств на кофе-подписку: ${BANK_ACCOUNT_INFO}`;
  ctx.sendMessage(text, { parse_mode: 'HTML' });
});

bot.command('reload', async (ctx) => {
  try {
    const newMap = await doc.loadMaps();
    console.log(`Mapping reloaded: ${JSON.stringify(newMap)}`);
  } catch (err) {
    console.error('Error reloading maps:', err);
    ctx.reply('Ошибка при загрузке данных из документа');
    return;
  }

  ctx.reply('Данные из документа успешно обновлены');
});

bot.command('state', (ctx) => {
  const monthRow = doc.getMonthRow();
  const monthDate = doc.getMonthDate();
  ctx.reply(`Current month row: ${monthRow}, date: ${monthDate}`);
});

function menu() {
  return Markup.keyboard([
        ['/debt'],
        ['/req'],
        ['/help'],
      ])
      .oneTime()
      .resize()
}

bot.command('menu', async (ctx) => {
  return await ctx.reply('Выбирай', menu())
})

{
  const bootMap = await doc.loadMaps();
  console.log(`Initial mapping loaded: ${JSON.stringify(bootMap)}`);
}

var reloadTimer = setInterval(async () => {
  try {
    await doc.loadMaps();
  } catch (err) {
    console.error('Error reloading document data:', err);
  }
}, 30 * 60 * 1000); // every 30 minutes

while (true) {
  try {
    await bot.launch()
    break;
  } catch (err) {
    console.error('Bot error, retrying in 5 seconds:', err);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Enable graceful stop
process.once('SIGINT', () => { reloadTimer.close(); bot.stop('SIGINT') })
process.once('SIGTERM', () => { reloadTimer.close(); bot.stop('SIGTERM') })