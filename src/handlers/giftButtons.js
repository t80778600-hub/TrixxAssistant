import {
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';

const STAFF_ROLE_ID = '1543938945056903239';

export default {
  customId: 'gifted',

  async execute(interaction) {
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

    const userId = interaction.message.embeds[0]?.footer?.text
      ?.replace('User ID: ', '');

    if (!userId) {
      return interaction.reply({
        content: 'Could not find the user for this request.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const user = await interaction.client.users.fetch(userId);

      await user.send(
        `Your Fortnite gift request has been **gifted** by ${interaction.user}.`
      );

      await interaction.update({
        embeds: [
          {
            ...interaction.message.embeds[0].data,
            title: 'Gift Request - Gifted',
            description:
              interaction.message.embeds[0].description +
              `\n\n**Gifted By:** ${interaction.user}`,
          },
        ],
        components: [],
      });
    } catch (error) {
      console.error('Gift button error:', error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            'I could not DM the requester. Their DMs may be disabled.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
