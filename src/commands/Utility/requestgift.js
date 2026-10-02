import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';

const GIFT_REQUEST_CHANNEL_ID = '1555365687810195566';

export default {
  data: new SlashCommandBuilder()
    .setName('requestgift')
    .setDescription('Submit a gift request')
    .addUserOption(option =>
      option
        .setName('username')
        .setDescription('The player receiving the gift')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('The item being requested')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('prize')
        .setDescription('The prize amount')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('username');
    const item = interaction.options.getString('item');
    const prize = interaction.options.getString('prize');

    const channel = await interaction.guild.channels
      .fetch(GIFT_REQUEST_CHANNEL_ID)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: 'The gift request channel could not be found.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#F1C40F')
      .setTitle('Gift Request Submitted')
      .setDescription(
        `**Player:** ${user}\n` +
        `**Item:** ${item}\n` +
        `**Prize:** ${prize}\n\n` +
        'Please click the **Gifted** button once you have sent the gift!'
      )
      .setFooter({
        text: 'Status: Pending'
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`gifted:${user.id}:${interaction.user.id}`)
        .setLabel('Gifted')
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: 'Your gift request has been submitted.',
      flags: MessageFlags.Ephemeral
    });
  }
};
