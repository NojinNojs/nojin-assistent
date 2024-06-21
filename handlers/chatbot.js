const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (
      message.author.bot ||
      message.channel.id !== process.env.CHATBOT_CHANNEL_ID ||
      !message.mentions.has(client.user)
    )
      return;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        message.content.replace(`<@${client.user.id}>`, '').trim(),
      ]);
      message.reply(result.response.text());
    } catch (error) {
      console.error('Error communicating with GEMINI API:', error);
      message.reply(
        'Sorry, I am having trouble processing your request right now.',
      );
    }
  });
};
