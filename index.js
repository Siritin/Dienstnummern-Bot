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

const ROLE_1 = "1477756205433618573";
const ROLE_2 = "1470891670055817439";
const ROLE_3 = "1470453619626082314";

const LOG_CHANNEL = "1477718800227897428";
const REQUEST_CHANNEL = "1477718932503658651";

client.once("ready", () => {
  console.log(`Bot gestartet als ${client.user.tag}`);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {

  if (!oldMember.roles.cache.has(ROLE_1) && newMember.roles.cache.has(ROLE_1)) {

    const channel = newMember.guild.channels.cache.get(REQUEST_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("📚 Ausbildungsanfrage")
      .setDescription(`Der Nutzer ${newMember} hat eine Ausbildungsanfrage.`)
      .setColor("Blue")
      .addFields(
        { name: "User", value: `${newMember.user.tag}`, inline: true },
        { name: "User ID", value: `${newMember.id}`, inline: true }
      )
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

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) return;

  const [action, userId] = interaction.customId.split("_");

  const member = await interaction.guild.members.fetch(userId);
  const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL);

  if (action === "accept") {

    await member.roles.add([ROLE_2, ROLE_3]);

    await member.send(
`🎓 **Ausbildungsanfrage angenommen**

Hallo ${member.user.username},

deine Ausbildungsanfrage wurde erfolgreich angenommen.

👤 **Bearbeitet von:** ${interaction.user.tag}

Du hast nun Zugriff auf die entsprechenden Ausbildungsrollen.

Viel Erfolg bei deiner Ausbildung!`
    ).catch(() => {});

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("✅ Ausbildung angenommen")
        .setColor("Green")
        .addFields(
          { name: "Antragsteller", value: `<@${member.id}>`, inline: true },
          { name: "Bearbeitet von", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] });
    }

    await interaction.reply({
      content: "✅ Ausbildung angenommen.",
      ephemeral: true
    });

  }

  if (action === "deny") {

    await member.roles.remove(ROLE_1);

    await member.send(
`❌ **Ausbildungsanfrage abgelehnt**

Hallo ${member.user.username},

leider wurde deine Ausbildungsanfrage abgelehnt.

👤 **Bearbeitet von:** ${interaction.user.tag}

Falls du Fragen hast, melde dich bitte beim Team.`
    ).catch(() => {});

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("❌ Ausbildung abgelehnt")
        .setColor("Red")
        .addFields(
          { name: "Antragsteller", value: `<@${member.id}>`, inline: true },
          { name: "Bearbeitet von", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] });
    }

    await interaction.reply({
      content: "❌ Ausbildung abgelehnt.",
      ephemeral: true
    });

  }

});

client.login(process.env.TOKEN); 