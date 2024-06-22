const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('end_chat')
    .setDescription('End the chat session and delete the channel'),
  async execute(interaction) {
    const channel = interaction.channel;
    const member = interaction.member;

    if (!channel) {
      return await interaction.reply({ content: 'Channel tidak ditemukan.', ephemeral: true });
    }

    if (channel.permissionsFor(member).has('MANAGE_CHANNELS')) {
      try {
        await channel.delete();
        interaction.client.activeSessions.delete(channel.id);
        delete interaction.client.chatMemory[channel.id];
        await interaction.reply({ content: 'Channel telah dihapus.', ephemeral: true });
      } catch (error) {
        console.error('Error deleting channel:', error);
        await interaction.reply({ content: 'Terjadi kesalahan saat menghapus channel.', ephemeral: true });
      }
    } else {
      await interaction.reply({ content: 'Anda tidak memiliki izin untuk menghapus channel ini.', ephemeral: true });
    }
  },
};
