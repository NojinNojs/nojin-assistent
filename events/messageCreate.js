module.exports = {
  name: 'messageCreate',
  execute: async (message, client) => {
    if (message.author.bot) return;

    if (message.content.startsWith(process.env.PREFIX)) {
      const args = message.content
        .slice(process.env.PREFIX.length)
        .trim()
        .split(/ +/);
      const commandName = args.shift().toLowerCase();

      const command = client.commands.get(commandName);
      if (!command) return;

      try {
        await command.execute(message, args);
      } catch (error) {
        console.error(error);
        message.reply('Terjadi kesalahan saat menjalankan perintah!');
      }
    }
  },
};
