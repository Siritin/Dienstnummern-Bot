const { Client, GatewayIntentBits, Partials, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

// =================== CONFIG ===================
const config = {
    servers: {
        polizei: {
            id: '1472702476976390319',
            logChannel: '1478085355054956759',
            roles: {
                schutzpolizei: '1478085209965596862',
                kripo: '1478085125341184243',
                sek: '1478085041824464996',
                leitung: '10/01'
            },
            prefixAbteilungen: ['11','12','13'],
            listChannel: null,
            listMessageId: null
        },
        feuerwehr: {
            id: '1472702786822078596',
            logChannel: '1478084726987161752',
            roles: {
                abteilung1: '1478084843437821972',
                abteilung2: '1478084932789076120',
                leitung: '20/01'
            },
            prefixAbteilungen: ['21','22'],
            listChannel: null,
            listMessageId: null
        },
        krankenhaus: {
            id: '1473354827718332697',
            logChannel: '1478084422925418526',
            roles: {
                abteilung: '1478084564835635453'
            },
            prefixAbteilungen: ['31'],
            listChannel: null,
            listMessageId: null
        },
        adac: {
            id: '1472703076837359782',
            logChannel: '1478084094494642266',
            roles: {
                abteilung: '1475956956991848559'
            },
            prefixAbteilungen: ['41'],
            listChannel: null,
            listMessageId: null
        }
    },
    dataFile: './dienstnummern.json',
    clientId: '1478353180298576013',  // <--- hier Client ID einfügen
    token: 'MTQ3ODM1MzE4MDI5ODU3NjAxMw.GVP974.UB61pS3rV5OXb0QQvaXnZgdrB3GF4n5YdHMwN0'          // <--- hier Bot Token einfügen
};

// =================== INIT DATA ===================
let dienstnummern = {};
if(fs.existsSync(config.dataFile)) {
    dienstnummern = JSON.parse(fs.readFileSync(config.dataFile));
}

function saveData() {
    fs.writeFileSync(config.dataFile, JSON.stringify(dienstnummern, null, 2));
}

function getNextNumber(serverKey, abteilungPrefix) {
    if(!dienstnummern[serverKey]) dienstnummern[serverKey] = {};
    if(!dienstnummern[serverKey][abteilungPrefix]) dienstnummern[serverKey][abteilungPrefix] = {};
    for(let i=3;i<100;i++){
        let num = i.toString().padStart(2,'0');
        if(!Object.values(dienstnummern[serverKey][abteilungPrefix]).includes(`${abteilungPrefix}/${num}`)){
            return `${abteilungPrefix}/${num}`;
        }
    }
    return null;
}

async function updateList(serverKey) {
    const serverConf = config.servers[serverKey];
    if(!serverConf.listChannel || !serverConf.listMessageId) return;
    const guild = client.guilds.cache.get(serverConf.id);
    if(!guild) return;
    const channel = guild.channels.cache.get(serverConf.listChannel);
    if(!channel) return;
    const message = await channel.messages.fetch(serverConf.listMessageId).catch(()=>null);
    if(!message) return;

    let listText = '';
    const serverData = dienstnummern[serverKey] || {};
    for(const abteilung in serverData){
        const entries = Object.entries(serverData[abteilung]).sort((a,b)=>{
            const n1 = parseInt(a[1].split('/')[1]);
            const n2 = parseInt(b[1].split('/')[1]);
            return n1 - n2;
        });
        for(const [userId, nummer] of entries){
            const member = guild.members.cache.get(userId);
            if(member) listText += `@[${nummer}] ${member.displayName}\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('Dienstnummer-Liste')
        .setDescription(listText || 'Keine Dienstnummern vergeben')
        .setColor('Purple')
        .setTimestamp();

    message.edit({ embeds: [embed] });
}

// =================== LOGIN ===================
client.once("ready", () => {
    console.log(`✅ Bot ist online als ${client.user.tag}`);
});

client.login(config.token);
