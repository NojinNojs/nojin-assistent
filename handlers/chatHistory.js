const fs = require('fs');
const path = require('path');

const chatHistoryFile = path.join(__dirname, '../data/chatHistory.json');

const loadChatHistory = () => {
  if (fs.existsSync(chatHistoryFile)) {
    const data = fs.readFileSync(chatHistoryFile);
    return JSON.parse(data);
  }
  return {};
};

const saveChatHistory = (chatMemory) => {
  fs.writeFileSync(chatHistoryFile, JSON.stringify(chatMemory, null, 2));
};

module.exports = { loadChatHistory, saveChatHistory };
