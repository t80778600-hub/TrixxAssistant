import {
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';

const STAFF_ROLE_ID = '1543938945056903239';

export default async function giftedButtonHandler(interaction) {
  try {
    const isAdmin = interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    );

    const isStaff = interaction.member?.roles?.cache?.has(STAFF_ROLE_ID);

    if (!isAdmin && !isStaff) {
      return interaction.reply({
        content: 'You do not have permission to use this button.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // gifted_123456789
    const userId = interaction.customId.split('_')[1];

    if (!userId) {
      return interaction.reply({
        content: 'The requester could not be found.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = await interaction.client.users.fetch(userId);

    await user.send(
      `Your Fortnite gift request has been **gifted** by ${interaction.user}.`
    );

    const embed = interaction.message.embeds[0];

    const updatedEmbed = EmbedBuilder.from(embed)
      .setTitle('Gift Request - Gifted')
      .addFields({
        name: 'Gifted By',
        value: `${interaction.user}`,
        inline: false,
      });

    await interaction.update({
      embeds: [updatedEmbed],
      components: [],
    });
  } catch (error) {
    console.error('GIFT BUTTON ERROR:', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Something went wrong while processing this gift.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
