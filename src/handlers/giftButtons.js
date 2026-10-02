import {
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';

const STAFF_ROLE_ID = '1543938945056903239';

export default {
  customId: 'gifted',

  async execute(interaction) {
    try {
      const isAdmin = interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator
      );

      const isStaff = interaction.member?.roles?.cache?.has(STAFF_ROLE_ID);

      if (!isAdmin && !isStaff) {
        return await interaction.reply({
          content: 'You do not have permission to use this button.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const oldEmbed = interaction.message.embeds[0];

      if (!oldEmbed) {
        return await interaction.reply({
          content: 'Could not find the gift request.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const footer = oldEmbed.footer?.text;

      if (!footer || !footer.startsWith('User ID: ')) {
        return await interaction.reply({
          content: 'Could not find the requester.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const userId = footer.replace('User ID: ', '').trim();

      const user = await interaction.client.users.fetch(userId);

      await user.send(
        `Your Fortnite gift request has been **gifted** by ${interaction.user.tag}.`
      );

      const updatedEmbed = EmbedBuilder.from(oldEmbed)
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
  },
};
