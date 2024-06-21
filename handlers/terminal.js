const moment = require('moment');

module.exports = async (client) => {
  const chalk = await import('chalk');

  client.on('ready', () => {
    console.log(
      chalk.default.green(
        `[${moment().format('YYYY-MM-DD HH:mm:ss')}] Bot is ready!`,
      ),
    );
  });

  client.on('messageCreate', (message) => {
    console.log(
      chalk.default.blue(
        `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message.author.tag}: ${message.content}`,
      ),
    );
  });
};
