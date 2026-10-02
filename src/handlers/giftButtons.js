import { PermissionFlagsBits, MessageFlags } from 'discord.js';

const STAFF_ROLE_ID = '1543938945056903239';

export default async function giftedButtonHandler(interaction) {
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

  const userId = interaction.customId.split(':')[1];

  if (!userId) {
    return interaction.reply({
      content: 'Requester not found.',
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    const user = await interaction.client.users.fetch(userId);

    await user.send(
      `Your Fortnite gift request has been gifted by ${interaction.user}.`
    );

    await interaction.update({
      content: 'Gifted successfully.',
      components: [],
    });
  } catch (error) {
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Could not DM the requester.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
