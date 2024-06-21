# Nojin Assistant Bot

Nojin Assistant Bot is a Discord bot that interacts with users in the style of Diablo from the anime Tensura. Using GEMINI AI for the API

## Features

- Responds to text messages with the style of Diablo.
- Analyzes images and provides detailed descriptions.
- Custom prompts for more personalized interactions.

## Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/NojinNojs/nojin-assistant.git
   cd nojin-assistant
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:

   ```plaintext
   GEMINI_API_KEY=your_gemini_api_key_here
   DISCORD_TOKEN=your_discord_token_here
   CHATBOT_CHANNEL_ID=your_chatbot_channel_id_here
   CUSTOM_ACTIVITY=your_custom_activity_here
   ```

4. Run the bot:
   ```sh
   node index.js
   ```

## Usage

Invite the bot to your server and interact with it in the specified channel.
