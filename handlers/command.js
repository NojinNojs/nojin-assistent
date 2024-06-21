const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, '../commands'))
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    client.commands.set(command.name, command);
  }
};
