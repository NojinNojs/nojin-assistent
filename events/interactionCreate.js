const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { saveChatHistory } = require('../handlers/chatHistory');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isButton()) {
      if (interaction.customId === 'start_interaction') {
        const modal = new ModalBuilder()
          .setCustomId('interaction_modal')
          .setTitle('Start Interaction');

        const channelNameInput = new TextInputBuilder()
          .setCustomId('channel_name')
          .setLabel('Set Channel Name')
          .setStyle(TextInputStyle.Short);

        const reasonInput = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Apa kebutuhan mu memanggilku?')
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
          new ActionRowBuilder().addComponents(channelNameInput),
          new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'interaction_modal') {
        const channelName = interaction.fields.getTextInputValue('channel_name');
        const reason = interaction.fields.getTextInputValue('reason');

        const guild = interaction.guild;
        const user = interaction.user;

        try {
          const newChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels],
              },
            ],
          });

          await newChannel.send(`Selamat datang, ${user.username}! Silakan ajukan pertanyaanmu kepada Diablo di sini. Untuk mengakhiri percakapan, gunakan perintah /end_chat.`);
          await newChannel.send(reason); // Mengirim prompt awalan yang diisi user

          client.activeSessions.add(newChannel.id); // Tambahkan sesi obrolan aktif
          client.chatMemory[newChannel.id] = []; // Inisialisasi memori obrolan
          saveChatHistory(client.chatMemory); // Simpan memori obrolan ke file JSON

          await interaction.reply({ content: `Channel ${channelName} telah dibuat dan sesi obrolan dimulai.`, ephemeral: true });

          // Mention user di channel baru
          await newChannel.send(`<@${user.id}>`);
        } catch (error) {
          console.error('Error creating channel:', error);
          await interaction.reply({ content: 'Terjadi kesalahan saat membuat channel. Silakan coba lagi.', ephemeral: true });
        }
      }
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'end_chat') {
      const channel = interaction.channel;
      const member = interaction.member;

      if (!channel) {
        return await interaction.reply({ content: 'Channel tidak ditemukan.', ephemeral: true });
      }

      if (channel.permissionsFor(member).has(PermissionsBitField.Flags.ManageChannels)) {
        try {
          await channel.delete();
          client.activeSessions.delete(channel.id);
          delete client.chatMemory[channel.id];
          saveChatHistory(client.chatMemory); // Simpan memori obrolan ke file JSON
          await interaction.reply({ content: 'Channel telah dihapus.', ephemeral: true });
        } catch (error) {
          console.error('Error deleting channel:', error);
          await interaction.reply({ content: 'Terjadi kesalahan saat menghapus channel.', ephemeral: true });
        }
      } else {
        await interaction.reply({ content: 'Anda tidak memiliki izin untuk menghapus channel ini.', ephemeral: true });
      }
    }

    // Default error handling
    if (!interaction.isCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
};
