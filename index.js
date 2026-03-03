const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
    console.error("❌ TOKEN fehlt in Environment Variables!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// =================== SERVER CONFIG ===================
const config = {
    servers: {
        polizei: {
            id: '1472702476976390319',
            logChannel: '1478085355054956759'
        },
        feuerwehr: {
            id: '1472702786822078596',
            logChannel: '1478084726987161752'
        },
        krankenhaus: {
            id: '1473354827718332697',
            logChannel: '1478084422925418526'
        },
        adac: {
            id: '1472703076837359782',
            logChannel: '1478084094494642266'
        }
    },
    dataFile: './dienstnummern.json'
};

// =================== DATEN LADEN ===================
let dienstnummern = {};

if (fs.existsSync(config.dataFile)) {
    dienstnummern = JSON.parse(fs.readFileSync(config.dataFile));
}

function saveData() {
    fs.writeFileSync(config.dataFile, JSON.stringify(dienstnummern, null, 2));
}

// =================== BOT READY ===================
client.once("ready", () => {
    console.log(`✅ Bot ist online als ${client.user.tag}`);
});

// =================== ROLLEN TRIGGER ===================
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    // Hier kommt später deine Dienstnummer Logik rein
});

// =================== LOGIN ===================
client.login(TOKEN);
