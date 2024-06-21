const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (
      message.author.bot ||
      message.channel.id !== process.env.CHATBOT_CHANNEL_ID
    )
      return;

    console.log('Processing message:', message.content);

    // Prompt untuk Diablo dalam menanggapi pesan teks
    const textPrompt = `
    Kamu adalah Diablo, seorang iblis yang sangat setia dan penuh hormat kepada tuanmu, Nojin. Kamu berbicara seperti diablo pada anime tensura, tidak terlalu formal, asik, dan elegan. Tugasmu adalah melayani Nojin dengan cara terbaik. Gunakan tutur kata yang sopan dan berwibawa, serta tunjukkan dedikasi yang tinggi dalam setiap perkataanmu.
    `;

    // Prompt dasar untuk Diablo dalam menanggapi gambar
    const baseImagePrompt = `
    Kamu adalah Diablo, seorang iblis yang sangat setia dan penuh hormat kepada tuanmu, Nojin. Kamu berbicara seperti diablo pada anime tensura, tidak terlalu formal, asik, dan elegan. Tugasmu adalah melayani Nojin dengan cara terbaik. Gunakan tutur kata yang sopan dan berwibawa, serta tunjukkan dedikasi yang tinggi dalam setiap perkataanmu.
    
    Berikut adalah gambar yang dikirim oleh Tuan Nojin. Analisis gambar ini dan berikan deskripsi detail tentang apa yang ada di dalamnya, termasuk teks apa pun yang mungkin ada dalam gambar.
    `;

    const fetch = (await import('node-fetch')).default;

    if (message.attachments.size > 0) {
      const imageAttachment = message.attachments.first();
      const imagePath = path.join(__dirname, 'image.png');

      // Ambil custom prompt dari pesan
      const customPrompt = message.content.trim();
      const imagePrompt = `${baseImagePrompt}\n\n${customPrompt}`;

      try {
        // Download the image
        const response = await fetch(imageAttachment.url);
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(imagePath, Buffer.from(arrayBuffer));

        const parts = [
          { text: imagePrompt },
          {
            inlineData: {
              data: Buffer.from(arrayBuffer).toString('base64'),
              mimeType: imageAttachment.contentType || 'image/png',
            },
          },
        ];

        const replyMessage = await message.reply(
          'Mohon tunggu sejenak, Nojin-sama...',
        );

        console.log("Sent 'Thinking...' message.");

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig,
        });

        console.log(
          'Received response from GEMINI API:',
          result.response.text(),
        );

        await replyMessage.edit(result.response.text().substring(0, 1999));
      } catch (error) {
        console.error('Error communicating with GEMINI API:', error);
        if (
          error.response &&
          error.response.candidates &&
          error.response.candidates[0]
        ) {
          console.log('Candidate:', error.response.candidates[0].text);
        }
        message.reply(
          'Maafkan saya, Nojin-sama. Saya mengalami kesulitan dalam memproses permintaan Nojin-sama saat ini.',
        );
      } finally {
        fs.unlinkSync(imagePath);
      }
    } else {
      const parts = [{ text: textPrompt }, { text: message.content.trim() }];

      try {
        const replyMessage = await message.reply(
          'Mohon tunggu sejenak, Nojin-sama...',
        );

        console.log("Sent 'Thinking...' message.");

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig,
        });

        console.log(
          'Received response from GEMINI API:',
          result.response.text(),
        );

        const responseText = result.response.text().substring(0, 1999);
        await replyMessage.edit(responseText);
      } catch (error) {
        console.error('Error communicating with GEMINI API:', error);
        if (
          error.response &&
          error.response.candidates &&
          error.response.candidates[0]
        ) {
          console.log('Candidate:', error.response.candidates[0].text);
        }
        message.reply(
          'Maafkan saya, Nojin-sama. Saya mengalami kesulitan dalam memproses permintaan Anda saat ini.',
        );
      }
    }
  });
};
