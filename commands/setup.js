const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the main interaction channel with Diablo bot'),
  async execute(interaction) {
    const channel = interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('Tertarik berbicara dengan ku?')
      .setDescription('Tidak? fufufu... tidak apa, panggil saja jika butuh aku, Nojin-sama')
      .setColor(0x00AE86);

    const button = new ButtonBuilder()
      .setCustomId('start_interaction')
      .setLabel('Ya')
      .setStyle(ButtonStyle.Primary);

    await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });

    await interaction.reply({ content: 'Setup completed!', ephemeral: true });
  },
};
