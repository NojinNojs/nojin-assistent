const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
  REST,
  Routes,
} = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');
const path = require('path');
const { loadChatHistory, saveChatHistory } = require('./handlers/chatHistory');

// Load environment variables
config();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// Command and event handlers
client.commands = new Collection();
client.slashCommands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selectMenus = new Collection();
client.chatMemory = loadChatHistory();
client.activeSessions = new Set(Object.keys(client.chatMemory));

// Load command and event handlers
const loadHandler = async (handler) => {
  try {
    const handlerPath = path.resolve(__dirname, `./handlers/${handler}.js`);
    const handlerModule = require(handlerPath);

    if (typeof handlerModule === 'function') {
      handlerModule(client);
    } else if (typeof handlerModule.default === 'function') {
      handlerModule.default(client);
    } else {
      console.error(`Handler ${handler} does not export a function`);
    }
  } catch (error) {
    console.error(`Error loading handler ${handler}:`, error);
  }
};

// Function to clean and deploy commands
const cleanAndDeployCommands = async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const commands = [];
  const commandFiles = fs
    .readdirSync(path.resolve(__dirname, './commands'))
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }

  try {
    console.log('Started deleting application (/) commands.');

    // Delete global commands
    const globalCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID),
    );

    for (const command of globalCommands) {
      await rest.delete(
        Routes.applicationCommand(process.env.CLIENT_ID, command.id),
      );
    }

    // Delete guild commands
    const guildCommands = await rest.get(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
    );

    for (const command of guildCommands) {
      await rest.delete(
        Routes.applicationGuildCommand(
          process.env.CLIENT_ID,
          process.env.GUILD_ID,
          command.id,
        ),
      );
    }

    console.log('Successfully deleted all application (/) commands.');

    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
};

const init = async () => {
  await Promise.all(
    [
      'command',
      'event',
      'slashCommand',
      'terminal',
      'chatbot',
      'messageCreate',
    ].map(loadHandler),
  );

  // Clean and deploy commands
  await cleanAndDeployCommands();

  // Login to Discord
  client.login(process.env.DISCORD_TOKEN);
};

init();

console.log('Bot is running...');

// Save chat history on exit
process.on('exit', () => {
  saveChatHistory(client.chatMemory);
});

process.on('SIGINT', () => {
  process.exit();
});

process.on('SIGTERM', () => {
  process.exit();
});
