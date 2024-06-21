const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    const pingEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Pong!')
      .setDescription(
        `Latency is ${Date.now() - interaction.createdTimestamp}ms.`,
      )
      .setTimestamp();

    await interaction.reply({ embeds: [pingEmbed] });
  },
};
