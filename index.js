const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const DATA_FILE = './data.json';

let data = {};
if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
}

function save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getNextAutoNumber(prefix) {
    if (!data[prefix]) data[prefix] = {};
    for (let i = 3; i <= 99; i++) {
        let num = i.toString().padStart(2, "0");
        if (!Object.values(data[prefix]).includes(`${prefix}/${num}`)) {
            return `${prefix}/${num}`;
        }
    }
    return null;
}

function getLeitungNumber(prefix) {
    if (!data[prefix]) data[prefix] = {};
    if (!Object.values(data[prefix]).includes(`${prefix}/01`)) return `${prefix}/01`;
    if (!Object.values(data[prefix]).includes(`${prefix}/02`)) return `${prefix}/02`;
    return null;
}

async function updateList(guild, prefix) {
    if (!data.lists || !data.lists[prefix]) return;

    const { channelId, messageId } = data.lists[prefix];
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const msg = await channel.messages.fetch(messageId).catch(()=>null);
    if (!msg) return;

    let text = "";
    if (data[prefix]) {
        const sorted = Object.entries(data[prefix]).sort((a,b)=>{
            return parseInt(a[1].split("/")[1]) - parseInt(b[1].split("/")[1]);
        });

        for (const [userId, nummer] of sorted) {
            text += `@[${nummer}] <@${userId}>\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`Dienstnummern ${prefix}`)
        .setDescription(text || "Keine vergeben")
        .setColor("Purple");

    msg.edit({embeds:[embed]});
}

client.once("ready", async () => {
    console.log(`✅ Bot online als ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName("liste")
            .setDescription("Erstellt eine Dienstnummer-Liste")
            .addStringOption(option =>
                option.setName("prefix")
                    .setDescription("z.B 11")
                    .setRequired(true)),

        new SlashCommandBuilder()
            .setName("leitung")
            .setDescription("Vergibt eine Leitungsnummer (01 oder 02)")
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("Mitglied")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("prefix")
                    .setDescription("z.B 10, 20, 31, 41")
                    .setRequired(true))
    ].map(c => c.toJSON());

    const rest = new REST({version:'10'}).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "liste") {
        const prefix = interaction.options.getString("prefix");

        const embed = new EmbedBuilder()
            .setTitle(`Dienstnummern ${prefix}`)
            .setDescription("Wird geladen...")
            .setColor("Purple");

        const msg = await interaction.channel.send({embeds:[embed]});
        await interaction.reply({content:"Liste erstellt ✅", ephemeral:true});

        if (!data.lists) data.lists = {};
        data.lists[prefix] = {
            channelId: interaction.channel.id,
            messageId: msg.id
        };
        save();
    }

    if (interaction.commandName === "leitung") {
        const user = interaction.options.getUser("user");
        const prefix = interaction.options.getString("prefix");
        const member = await interaction.guild.members.fetch(user.id);

        const nummer = getLeitungNumber(prefix);
        if (!nummer) {
            return interaction.reply({content:"❌ 01 und 02 bereits vergeben!", ephemeral:true});
        }

        if (!data[prefix]) data[prefix] = {};
        data[prefix][member.id] = nummer;
        save();

        const role = await interaction.guild.roles.create({
            name: `[${nummer}]`
        });

        await member.roles.add(role);
        await member.setNickname(`[${nummer}] ${member.user.username}`).catch(()=>{});

        updateList(interaction.guild, prefix);

        interaction.reply({content:`✅ ${nummer} vergeben`, ephemeral:true});
    }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const addedRole = newMember.roles.cache.find(r => !oldMember.roles.cache.has(r.id));
    if (!addedRole) return;

    if (!/^\d{2}$/.test(addedRole.name)) return;

    const prefix = addedRole.name;
    const nummer = getNextAutoNumber(prefix);
    if (!nummer) return;

    if (!data[prefix]) data[prefix] = {};
    data[prefix][newMember.id] = nummer;
    save();

    const role = await newMember.guild.roles.create({
        name: `[${nummer}]`
    });

    await newMember.roles.add(role);
    await newMember.setNickname(`[${nummer}] ${newMember.user.username}`).catch(()=>{});

    updateList(newMember.guild, prefix);
});

client.login(TOKEN);
