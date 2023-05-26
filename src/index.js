require('dotenv').config(); // Load environment variables from .env file

const { Client, IntentsBitField } = require('discord.js'); // Discord client

const axios = require('axios'); // HTTP client

const client = new Client({ // Create a new Discord client
  intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
  ],
})

// IGDB API credentials
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;


// This function takes an array of choices and returns a random element from it
function choose(choices) {
  let index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

// This event triggers when the bot is ready
client.on('ready', (c) => {
  console.log(`Logged in as ${c.user.tag}!`);
});

// Listen for new messages
// !choose function of the bot
client.on('messageCreate', message => {
  // Check if the message starts with the "!choose" command and is not sent by a bot
  if (message.content.startsWith('!choose') && !message.author.bot) {
    // Get the inputs by splitting the message content by commas and trimming any extra whitespace
    const args = message.content.slice(8).split(',').map(arg => arg.trim());
    // Check if there are any inputs provided
    if (args.length > 0 && args[0] !== '') {
      // Choose a random input
      const randomIndex = Math.floor(Math.random() * args.length);
      // Send the chosen input as a message to the channel
      message.channel.send(args[randomIndex]);
    } 
    else {
      // If no inputs are provided, send a message asking for some inputs
      message.channel.send('Please provide some inputs for me to choose from, separated by commas.');
    }
  }
});

// Function for retrieving an access token from the IGDB API
async function getAccessToken() {
  try {
    // Use the IGDB API to retrieve an access token
    const response = await axios({
      url: 'https://id.twitch.tv/oauth2/token',
      method: 'POST',
      params: {
        client_id: IGDB_CLIENT_ID,
        client_secret: IGDB_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    });
    // Return the access token from the response data
    return response.data.access_token;
  }
  catch (error) {
    // If there is an error, log it to the console
    console.error(error);
  }
}

// This will utilize the IGDB API to search for a game based on the user's input
client.on('messageCreate', async message => {
  // Check if the message starts with the "!game" command and is not sent by a bot
  if (message.content.startsWith('!game') && !message.author.bot) {
    // Get the game name by removing the "!game" command from the message content
    const gameName = message.content.slice(6).trim();
    // Check if the game name is provided
    if (gameName) {
      try {
        // Use the IGDB API to search for the game
        const response = await axios({
          url: 'https://api.igdb.com/v4/games',
          method: 'POST',
          headers: {
            'Client-ID': IGDB_CLIENT_ID,
            'Authorization': `Bearer ${await getAccessToken()}`
          },
          data: `fields name, summary, release_dates.date, slug; search "${gameName}";`
        });
        // Get the first game from the response data
        const game = response.data[0];
        // Check if the game exists
        if (game) {
          // Format the game release date as a string
          const releaseDate = new Date(game.release_dates[0].date * 1000).toDateString();
          // Construct a URL to the game's page on the IGDB website
          const gameURL = `https://www.igdb.com/games/${game.slug}`;
          // Send the game information as a message to the channel
          message.channel.send(`**${game.name}**\n\n${game.summary}\n\nReleased on: ${releaseDate}\n\nMore information: ${gameURL}`);
        }
        else{
          // If the game does not exist, send a message saying so
          message.channel.send(`Sorry, I couldn't find any games matching "${gameName}".`);
        }
      }
      catch (error) {
        // If there is an error, log it to the console and send a message saying so
        console.error(error);
        message.channel.send('Sorry, there was an error searching for that game.');
      }
    }
    else {
      // If no game name is provided, send a message asking for one
      message.channel.send('Please provide the name of a game to search for.');
    }
  }
});


// Login to Discord with your bot's token
client.login(process.env.CLIENT_TOKEN);