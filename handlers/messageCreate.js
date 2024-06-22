const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');
const { createCanvas, loadImage } = require('canvas');
const { saveChatHistory } = require('./chatHistory');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  safetySettings: safetySettings,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const generateResponse = async (parts) => {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
  });

  let responseText = result.response.text();
  return responseText;
};

const sendReplyInChunks = async (message, text) => {
  const chunkSize = 1999;
  let chunks = [];
  let currentChunk = '';

  text.split('\n').forEach((line) => {
    if ((currentChunk + '\n' + line).length > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  });

  if (currentChunk) chunks.push(currentChunk);

  for (let chunk of chunks) {
    await message.channel.send(chunk);
  }
};

// Fungsi untuk membuat gambar dari ekspresi matematika
const createMathImage = async (expression, result) => {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#fff';
  ctx.font = '40px Arial';
  ctx.fillText(`Ekspresi: ${expression}`, 50, 100);
  ctx.fillText(`Hasil: ${result}`, 50, 200);

  const buffer = canvas.toBuffer('image/png');
  const imagePath = path.join(__dirname, 'math_expression.png');
  fs.writeFileSync(imagePath, buffer);

  return imagePath;
};

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const chatId = message.channel.id;

    if (!client.activeSessions.has(chatId)) return;

    if (!client.chatMemory[chatId]) {
      client.chatMemory[chatId] = [];
    }
    client.chatMemory[chatId].push({ user: message.content, bot: null });

    // Simpan chat memory setiap kali ada pesan baru
    saveChatHistory(client.chatMemory);

    // Logika bot gelisah jika tidak ada balasan
    setTimeout(async () => {
      const lastMessage = client.chatMemory[chatId].slice(-1)[0];
      if (lastMessage && !lastMessage.bot) {
        const parts = [{ text: `Diablo, mengapa Tuan Nojin belum menjawab?` }];
        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig,
        });
        await message.channel.send(`${message.author}, ${result.response.text().substring(0, 1999)}`);
      }
    }, 60000); // 1 menit

    console.log('Processing message:', message.content);

    const textPrompt = `
    Kamu adalah Diablo, seorang iblis yang sangat setia dan penuh hormat kepada tuanmu, Nojin. Kamu berbicara seperti Diablo pada anime Tensura, tidak terlalu formal, asik, dan elegan. Tugasmu adalah melayani Nojin dengan cara terbaik. Gunakan tutur kata yang sopan dan berwibawa, serta tunjukkan dedikasi yang tinggi dalam setiap perkataanmu. Berikan jawaban yang lengkap dan detail.
    `;

    const baseImagePrompt = `
    Kamu adalah Diablo, seorang iblis yang sangat setia dan penuh hormat kepada tuanmu, Nojin. Kamu berbicara seperti Diablo pada anime Tensura, tidak terlalu formal, asik, dan elegan. Tugasmu adalah melayani Nojin dengan cara terbaik. Gunakan tutur kata yang sopan dan berwibawa, serta tunjukkan dedikasi yang tinggi dalam setiap perkataanmu. Berikut adalah gambar yang dikirim oleh Tuan Nojin. Analisis gambar ini dan berikan deskripsi detail tentang apa yang ada di dalamnya, termasuk teks apa pun yang mungkin ada dalam gambar. Berikan jawaban yang lengkap dan detail.
    `;

    // Fungsi untuk memproses pesan matematika
    const processMathExpression = (expression) => {
      try {
        const result = math.evaluate(expression);
        return createMathImage(expression, result);
      } catch (error) {
        return `Maaf, saya tidak dapat memproses ekspresi matematika "${expression}". Pastikan ekspresi tersebut benar.`;
      }
    };

    if (message.attachments.size > 0) {
      const imageAttachment = message.attachments.first();
      const imagePath = path.join(__dirname, 'image.png');

      const customPrompt = message.content.trim();
      const imagePrompt = `${baseImagePrompt}\n\n${customPrompt}`;

      try {
        // Gunakan impor dinamis untuk node-fetch
        const fetch = (await import('node-fetch')).default;

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

        const replyMessage = await message.reply('Mohon tunggu sebentar, Nojin-sama...');

        console.log("Sent 'Thinking...' message.");

        const responseText = await generateResponse(parts);

        console.log('Received response from GEMINI API:', responseText);

        client.chatMemory[chatId].push({ user: message.content, bot: responseText });
        await replyMessage.edit('Ini jawaban saya, Nojin-sama:');
        await sendReplyInChunks(replyMessage, responseText);
      } catch (error) {
        console.error('Error communicating with GEMINI API:', error);
        if (error.response && error.response.candidates && error.response.candidates[0]) {
          console.log('Candidate:', error.response.candidates[0].text);
        }
        message.reply('Maafkan saya, Nojin-sama. Saya mengalami kesulitan dalam memproses permintaan Nojin-sama saat ini.');
      } finally {
        fs.unlinkSync(imagePath);
      }
    } else {
      let responseText;

      // Periksa apakah pesan adalah ekspresi matematika
      if (/^[0-9+\-*/().^% ]+$/.test(message.content.trim())) {
        const imagePath = await processMathExpression(message.content.trim());
        await message.channel.send({ files: [imagePath] });
        fs.unlinkSync(imagePath);
        responseText = null; // No text response needed for math images
      } else {
        const context = client.chatMemory[chatId].map((entry) => `User: ${entry.user}\nBot: ${entry.bot}`).join('\n\n');
        const fullPrompt = `${textPrompt}\n\n${context}\n\nUser: ${message.content}\nBot:`;

        const parts = [{ text: fullPrompt }];

        responseText = await generateResponse(parts);
      }

      try {
        const replyMessage = await message.reply('Mohon tunggu sebentar, Nojin-sama...');

        console.log("Sent 'Thinking...' message.");

        if (responseText) {
          client.chatMemory[chatId].push({ user: message.content, bot: responseText });
          saveChatHistory(client.chatMemory);
          await replyMessage.edit('Ini jawaban saya, Nojin-sama:');
          await sendReplyInChunks(replyMessage, responseText);
        }
      } catch (error) {
        console.error('Error communicating with GEMINI API:', error);
        if (error.response && error.response.candidates && error.response.candidates[0]) {
          console.log('Candidate:', error.response.candidates[0].text);
        }
        message.reply('Maafkan saya, Nojin-sama. Saya mengalami kesulitan dalam memproses permintaan Anda saat ini.');
      }
    }
  });
};
