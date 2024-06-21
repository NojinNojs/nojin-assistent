const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Bot telah siap! Login sebagai ${client.user.tag}`);
    client.user.setPresence({
      activities: [
        { name: process.env.CUSTOM_ACTIVITY, type: ActivityType.Playing },
      ],
      status: 'idle',
    });
  },
};
