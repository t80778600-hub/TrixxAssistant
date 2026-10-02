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
    .setDescription('Submit a Fortnite gift request')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('Enter the Fortnite username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('Enter the item you want')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('cost')
        .setDescription('Enter the cost of the item')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const item = interaction.options.getString('item');
    const cost = interaction.options.getString('cost');

    const channel = await interaction.client.channels.fetch(
      GIFT_CHANNEL_ID
    );

    if (!channel) {
      return interaction.reply({
        content: 'The gift request channel could not be found.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Gift Request Submitted')
      .setDescription(
        `**${username}** has requested **${item}** from the item shop.\n\n` +
        `**Cost:** ${cost}\n\n` +
        `Please click the **Gifted** button once you have sent the gift!`
      )
      .setFooter({
        text: `Requested by: ${interaction.user.id}`,
      })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId(`gifted`)
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
