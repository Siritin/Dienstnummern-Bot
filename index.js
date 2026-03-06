const {
Client,
GatewayIntentBits,
Partials,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require("discord.js");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers
],
partials: [Partials.GuildMember]
});

/*
=========================
DEINE IDs
=========================
*/

const ROLE_1 = "1477756205433618573";
const ROLE_2 = "1470891670055817439";
const ROLE_3 = "1470453619626082314";

const LOG_CHANNEL = "1477718800227897428";
const REQUEST_CHANNEL = "1477718932503658651";

/*
=========================
DM NACHRICHTEN
=========================
*/

const ACCEPT_DM = (user, moderator) => `
🎓 Ausbildung abgeschlossen

Hallo ${user},

deine Ausbildung wurde erfolgreich angenommen und abgeschlossen.

Du hast nun Zugriff auf die entsprechenden Rollen und Bereiche.

Wir wünschen dir weiterhin viel Erfolg auf dem Server!

Bearbeitet von: ${moderator}
`;

const DENY_DM = (user, moderator) => `
❌ Ausbildung nicht bestanden

Hallo ${user},

leider hast du deine Ausbildung dieses Mal nicht bestanden.

Du kannst zu einem späteren Zeitpunkt erneut versuchen, die Ausbildung zu absolvieren.

Bei Fragen kannst du dich gerne an das Team wenden.

Bearbeitet von: ${moderator}
`;

client.once("ready", () => {
console.log(`Bot gestartet als ${client.user.tag}`);
});

/*
=========================
ROLLE TRIGGER
=========================
*/

client.on("guildMemberUpdate", async (oldMember, newMember) => {

if (!oldMember.roles.cache.has(ROLE_1) && newMember.roles.cache.has(ROLE_1)) {

const channel = newMember.guild.channels.cache.get(REQUEST_CHANNEL);
if (!channel) return;

const embed = new EmbedBuilder()
.setTitle("📚 Ausbildung")
.setDescription(`Der Nutzer ${newMember} wartet auf Bestätigung.`)
.setColor("Blue")
.setTimestamp();

const buttons = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId(`accept_${newMember.id}`)
.setLabel("Annehmen")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`deny_${newMember.id}`)
.setLabel("Ablehnen")
.setStyle(ButtonStyle.Danger)

);

await channel.send({
embeds: [embed],
components: [buttons]
});

}

});

/*
=========================
BUTTON SYSTEM
=========================
*/

client.on("interactionCreate", async interaction => {

if (!interaction.isButton()) return;

const [action, userId] = interaction.customId.split("_");

const member = await interaction.guild.members.fetch(userId);
const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);

const disabledButtons = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("accepted")
.setLabel("Angenommen")
.setStyle(ButtonStyle.Success)
.setDisabled(true),

new ButtonBuilder()
.setCustomId("denied")
.setLabel("Abgelehnt")
.setStyle(ButtonStyle.Danger)
.setDisabled(true)

);

/*
=========================
ANNEHMEN
=========================
*/

if (action === "accept") {

await member.roles.add([ROLE_2, ROLE_3]);
await member.roles.remove(ROLE_1);

await member.send(
ACCEPT_DM(member.user.username, interaction.user.tag)
).catch(() => {});

const embed = new EmbedBuilder()
.setTitle("✅ Ausbildung angenommen")
.setDescription(`${member} wurde angenommen.`)
.addFields(
{ name: "Bearbeitet von", value: `<@${interaction.user.id}>` }
)
.setColor("Green")
.setTimestamp();

await interaction.message.edit({
embeds: [embed],
components: [disabledButtons]
});

const logEmbed = new EmbedBuilder()
.setTitle("✅ Ausbildung angenommen")
.setColor("Green")
.addFields(
{ name: "User", value: `<@${member.id}>`, inline: true },
{ name: "Bearbeitet von", value: `<@${interaction.user.id}>`, inline: true }
)
.setTimestamp();

logChannel.send({ embeds: [logEmbed] });

await interaction.reply({
content: "✅ Entscheidung gespeichert.",
ephemeral: true
});

}

/*
=========================
ABLEHNEN
=========================
*/

if (action === "deny") {

await member.roles.remove(ROLE_1);

await member.send(
DENY_DM(member.user.username, interaction.user.tag)
).catch(() => {});

const embed = new EmbedBuilder()
.setTitle("❌ Ausbildung abgelehnt")
.setDescription(`${member} wurde abgelehnt.`)
.addFields(
{ name: "Bearbeitet von", value: `<@${interaction.user.id}>` }
)
.setColor("Red")
.setTimestamp();

await interaction.message.edit({
embeds: [embed],
components: [disabledButtons]
});

const logEmbed = new EmbedBuilder()
.setTitle("❌ Ausbildung abgelehnt")
.setColor("Red")
.addFields(
{ name: "User", value: `<@${member.id}>`, inline: true },
{ name: "Bearbeitet von", value: `<@${interaction.user.id}>`, inline: true }
)
.setTimestamp();

logChannel.send({ embeds: [logEmbed] });

await interaction.reply({
content: "❌ Entscheidung gespeichert.",
ephemeral: true
});

}

});

client.login(process.env.TOKEN);
