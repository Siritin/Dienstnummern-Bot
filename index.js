const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* =========================
   🔧 KONFIGURATION (FERTIG)
   ========================= */

const ROLE_1 = '1477756205433618573'; // Startrolle
const ROLE_2 = '1470891670055817439'; // Rolle bei Annahme
const ROLE_3 = '1470453619626082314'; // Rolle bei Annahme

const LOG_CHANNEL_ID = '1477718800227897428';      // Log-Channel
const REQUEST_CHANNEL_ID = '1477718932503658651'; // Button-Channel

/* ========================= */

client.once('ready', () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
});

/**
 * 🔔 Trigger: ROLE_1 wird vergeben
 */
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (
    !oldMember.roles.cache.has(ROLE_1) &&
    newMember.roles.cache.has(ROLE_1)
  ) {
    const channel = newMember.guild.channels.cache.get(REQUEST_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('Ausbildungsentscheidung')
      .setDescription(
        `Für ${newMember} wurde eine Ausbildung beantragt.\n\n` +
        `Bitte entscheiden Sie, ob die Ausbildung **angenommen** oder **abgelehnt** wird.`
      )
      .setColor(0x3498db)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ausbildung_annehmen:${newMember.id}`)
        .setLabel('Annehmen')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ausbildung_ablehnen:${newMember.id}`)
        .setLabel('Ablehnen')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

/**
 * 🖱️ Button-Handler
 */
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, targetId] = interaction.customId.split(':');
  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);

  if (!targetMember) {
    return interaction.reply({
      content: '❌ Ziel-User nicht gefunden.',
      ephemeral: true
    });
  }

  const decisionBy = interaction.user;
  const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
  const timestamp = Math.floor(Date.now() / 1000);

  // ✅ ANNEHMEN
  if (action === 'ausbildung_annehmen') {
    await targetMember.roles.add([ROLE_2, ROLE_3]);
    await targetMember.roles.remove(ROLE_1);

    // 📩 DM
    const acceptEmbed = new EmbedBuilder()
      .setTitle('Ausbildungsentscheidung')
      .setColor(0x2ecc71)
      .setDescription(
        `Sehr geehrte/r ${targetMember.user.username},\n\n` +
        `wir freuen uns, Ihnen mitteilen zu können, dass Ihre **Ausbildung angenommen** wurde.\n\n` +
        `**Entscheider:** ${decisionBy.tag}\n\n` +
        `Mit freundlichen Grüßen\n` +
        `**Ausbildungsteam**`
      )
      .setTimestamp();

    await targetMember.send({ embeds: [acceptEmbed] }).catch(() => {});

    // 🧾 Log
    const logEmbed = new EmbedBuilder()
      .setTitle('✅ Ausbildung angenommen')
      .setColor(0x2ecc71)
      .addFields(
        { name: 'Ziel-User', value: `${targetMember} (${targetMember.id})` },
        { name: 'Entscheider', value: `${decisionBy} (${decisionBy.id})` },
        { name: 'Zeitpunkt', value: `<t:${timestamp}:F>` }
      )
      .setTimestamp();

    logChannel?.send({ embeds: [logEmbed] });

    await interaction.reply({
      content: `✅ Ausbildung für ${targetMember} wurde angenommen.`,
      ephemeral: true
    });
  }

  // ❌ ABLEHNEN
  if (action === 'ausbildung_ablehnen') {
    await targetMember.roles.remove(ROLE_1);

    // 📩 DM
    const declineEmbed = new EmbedBuilder()
      .setTitle('Ausbildungsentscheidung')
      .setColor(0xe74c3c)
      .setDescription(
        `Sehr geehrte/r ${targetMember.user.username},\n\n` +
        `wir bedauern, Ihnen mitteilen zu müssen, dass Ihre **Ausbildung abgelehnt** wurde.\n\n` +
        `**Entscheider:** ${decisionBy.tag}\n\n` +
        `Mit freundlichen Grüßen\n` +
        `**Ausbildungsteam**`
      )
      .setTimestamp();

    await targetMember.send({ embeds: [declineEmbed] }).catch(() => {});

    // 🧾 Log
    const logEmbed = new EmbedBuilder()
      .setTitle('❌ Ausbildung abgelehnt')
      .setColor(0xe74c3c)
      .addFields(
        { name: 'Ziel-User', value: `${targetMember} (${targetMember.id})` },
        { name: 'Entscheider', value: `${decisionBy} (${decisionBy.id})` },
        { name: 'Zeitpunkt', value: `<t:${timestamp}:F>` }
      )
      .setTimestamp();

    logChannel?.send({ embeds: [logEmbed] });

    await interaction.reply({
      content: `❌ Ausbildung für ${targetMember} wurde abgelehnt.`,
      ephemeral: true
    });
  }
});

client.login('DEIN_BOT_TOKEN');