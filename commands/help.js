const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Daftar semua perintah yang tersedia'),
  async execute(interaction) {
    const commandList = interaction.client.slashCommands
      .map((cmd) => `\`${cmd.data.name}\`: ${cmd.data.description}`)
      .join('\n');
    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Daftar Perintah')
      .setDescription(commandList)
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};
