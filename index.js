const { Client, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');

const { TOKEN,CLIENT_ID, CATAPI} = require('./secrets.json');
const { users } = require('./users.json');

const clr = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    white: "\x1b[0m",
    blue: "\x1b[34m"
};


const soundPath = "sounds/"

const chance = {
    "gif": 3,
    "react": 15
}

function random(percent) {
    return Math.floor(Math.random()*100) < percent;
}

function RandomReact(msg,emotes) {
    msg.react(emotes[Math.floor(Math.random() * emotes.length)]);
}

function RandomReply(msg,gifs) {
    msg.reply(gifs[Math.floor(Math.random() * gifs.length)]);
}

function playSound(user,sound){
    try {
        
            
            const channel = user.voice.channel;

            console.log(`${user.user.username} joined a voice channel`);

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`Bot has joined the voice channel: ${channel.name} and played: ${sound}`);
            });

            const player = createAudioPlayer();
            var resource = createAudioResource(`${soundPath}${sound}.mp3`);



            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            player.on('error', error => {
                console.error(`Error with audio player: ${error.message}`);
            });
        }
        catch (error) {
            console.error(`Error processing voice state update: ${error.message}`);
        }
}

const commands = [
    {
      name: 'bonk',
      description: 'Plays BONK! sound',
    },
    {
      name: 'roll',
      description: 'DEATH ROLL!',
      options: [
        {
          name: 'max',
          description: 'The maximum number to roll (default is 100)',
          type: 4,
          required: false,
        },
      ],
    },
    {
        name: 'kitty',
        description: 'Sends a random cat picture!',
      },
  ];


  const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID), 
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error while reloading application (/) commands:', error);
  }
})();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});



client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if(newState.member.user.bot){
        return;
    }
    else if (!oldState.channelId && newState.channelId) {
        playSound(newState.member,"wonderful-day")
    }
});

client.on(Events.MessageCreate, msg => {
    try{

        if(!msg.author.bot){
        const author = msg.author.id
        console.log(`${clr.green}${msg.author.username}${clr.white} : '${clr.blue}${msg.content}${clr.white}' => ${clr.yellow}${msg.channel.name}${clr.white}`);
            switch(msg.content.toLocaleLowerCase()){
                case '@everyone':
                    msg.reply("We don't do that here");
                    msg.react('😬');
                    return;
                case 'hello there':
                    msg.reply('General Kenobi!');
                    return;
            }
            
        if(users[author] != undefined){
            if(random(chance.gif)){
                RandomReply(msg,users[author].gifs)
                return;
            }
            else if(random(chance.react)) {
                if(users[author].emotes[0] != ""){
                    RandomReact(msg,users.default.emotes.concat(users[author].emotes))
                }
                else{
                    RandomReact(msg,users.default.emotes)
                }
            }
        }
        else{
            if(random(chance.react)){
                RandomReact(msg,users.default.emotes)
            }
        }

        }
    }
    catch (error) {
        console.error(error)
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'bonk') {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return await interaction.reply('You need to be in a voice channel to use this command!');
        }

        await interaction.reply('Bonk incoming!');
        playSound(interaction.member,"bonk")
    }
    else if (commandName === 'roll') {
        const max = interaction.options.getInteger('max') || 100;
        const roll = Math.floor(Math.random() * max) + 1;

        await interaction.reply(`${interaction.member} rolls ${roll} (1-${max})`);
    }else if (commandName === 'kitty') {
        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search', {
                headers: {
                    'x-api-key': CATAPI
                }
            });

            const data = await response.json();
            const imageUrl = data[0].url;

            await interaction.reply({ content: 'Here’s a cute cat!', files: [imageUrl] });

        } catch (error) {
            console.error('Error fetching cat image:', error);
            await interaction.reply('Sorry, I couldn’t fetch a cat picture at the moment.');
        }
    }
});

client.login(TOKEN);