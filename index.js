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
   🔧 KONFIGURATION
   ========================= */

const ROLE_1 = '1477756205433618573';
const ROLE_2 = '1470891670055817439';
const ROLE_3 = '1470453619626082314';

const LOG_CHANNEL_ID = '1477718800227897428';
const REQUEST_CHANNEL_ID = '1477718932503658651';

/* ========================= */

client.once('ready', () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
});

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

    await channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, targetId] = interaction.customId.split(':');
  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
  if (!targetMember) return;

  const decisionBy = interaction.user;
  const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
  const time = `<t:${Math.floor(Date.now() / 1000)}:F>`;

  if (action === 'ausbildung_annehmen') {
    await targetMember.roles.add([ROLE_2, ROLE_3]);
    await targetMember.roles.remove(ROLE_1);

    await targetMember.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Ausbildungsentscheidung')
          .setColor(0x2ecc71)
          .setDescription(
            `Sehr geehrte/r ${targetMember.user.username},\n\n` +
            `Ihre **Ausbildung wurde angenommen**.\n\n` +
            `**Entscheider:** ${decisionBy.tag}\n\n` +
            `Mit freundlichen Grüßen\n**Ausbildungsteam**`
          )
          .setTimestamp()
      ]
    }).catch(() => {});

    logChannel?.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ Ausbildung angenommen')
          .setColor(0x2ecc71)
          .addFields(
            { name: 'Ziel-User', value: `${targetMember}` },
            { name: 'Entscheider', value: `${decisionBy}` },
            { name: 'Zeitpunkt', value: time }
          )
          .setTimestamp()
      ]
    });

    return interaction.reply({ content: '✅ Entscheidung gespeichert.', ephemeral: true });
  }

  if (action === 'ausbildung_ablehnen') {
    await targetMember.roles.remove(ROLE_1);

    await targetMember.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Ausbildungsentscheidung')
          .setColor(0xe74c3c)
          .setDescription(
            `Sehr geehrte/r ${targetMember.user.username},\n\n` +
            `Ihre **Ausbildung wurde abgelehnt**.\n\n` +
            `**Entscheider:** ${decisionBy.tag}\n\n` +
            `Mit freundlichen Grüßen\n**Ausbildungsteam**`
          )
          .setTimestamp()
      ]
    }).catch(() => {});

    logChannel?.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Ausbildung abgelehnt')
          .setColor(0xe74c3c)
          .addFields(
            { name: 'Ziel-User', value: `${targetMember}` },
            { name: 'Entscheider', value: `${decisionBy}` },
            { name: 'Zeitpunkt', value: time }
          )
          .setTimestamp()
      ]
    });

    return interaction.reply({ content: '❌ Entscheidung gespeichert.', ephemeral: true });
  }
});

/* =========================
   🔑 RAILWAY LOGIN
   ========================= */

client.login(process.env.DISCORD_TOKEN); 