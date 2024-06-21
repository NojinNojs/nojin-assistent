const fs = require('fs');
const path = require('path');

module.exports = async (client) => {
  const chalk = await import('chalk');

  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, '../commands'))
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    if (command.data) {
      client.slashCommands.set(command.data.name, command);
      console.log(
        chalk.default.green(`Loaded slash command: ${command.data.name}`),
      );
    }
  }
};
