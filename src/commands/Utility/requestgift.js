import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';

const GIFT_CHANNEL_ID = '1555365687810195566';

export default {
  data: new SlashCommandBuilder()
    .setName('requestgift')
    .setDescription('Request an item shop gift')
    .addUserOption(option =>
      option
        .setName('username')
        .setDescription('The person requesting the gift')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('The item you want')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('prize')
        .setDescription('The prize/value')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('username');
    const item = interaction.options.getString('item');
    const prize = interaction.options.getString('prize');

    const channel = interaction.guild.channels.cache.get(GIFT_CHANNEL_ID);

    if (!channel) {
      return interaction.reply({
        content: 'Gift request channel could not be found.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Gift Request Submitted')
      .setDescription(
        `${user} has requested **${item}** from the item shop.\n\n` +
        `**Prize:** ${prize}\n\n` +
        `Please click the **Gifted** button once you have sent the gift!`
      )
      .setColor(0x2b2d31)
      .setFooter({
        text: `User ID: ${user.id}`,
      })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('gifted')
      .setLabel('Gifted')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: 'Your gift request has been submitted.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
