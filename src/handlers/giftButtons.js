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

    const embed = interaction.message.embeds[0];

    if (!embed) {
      return interaction.reply({
        content: 'Could not find the gift request.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const userId = embed.footer?.text?.replace('User ID: ', '');

    if (!userId) {
      return interaction.reply({
        content: 'Could not find the requester.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const user = await interaction.client.users.fetch(userId);

      await user.send(
        `Your Fortnite gift request has been **gifted** by ${interaction.user}.`
      );

      await interaction.update({
        content: '✅ Gift marked as gifted.',
        components: [],
      });

      await interaction.message.edit({
        embeds: [
          {
            ...embed.data,
            title: 'Gift Request - Gifted',
            description:
              `${embed.description || ''}\n\n**Gifted By:** ${interaction.user}`,
          },
        ],
      });
    } catch (error) {
      console.error('Gift button error:', error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            'Could not DM the requester. Their DMs may be disabled.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
