import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ModerationService } from '../../services/moderation/moderationService.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

const BAN_ROLE_ID = '1543948135418560582';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption((option) =>
            option
                .setName('target')
                .setDescription('The user to ban')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('Reason for the ban'),
        )

        // Discord will only automatically allow Administrators.
        // The custom role is checked manually below.
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    category: 'moderation',

    async execute(interaction, config, client) {
        // Get the member from the guild to make sure we have their
        // current roles and permissions.
        const member = await interaction.guild.members.fetch(
            interaction.user.id
        );

        // Check if they are a Discord Administrator.
        const isAdmin = member.permissions.has(
            PermissionFlagsBits.Administrator
        );

        // Check if they have the specific Ban role.
        const hasBanRole = member.roles.cache.has(BAN_ROLE_ID);

        // ONLY Administrator OR the specific role can continue.
        if (!isAdmin && !hasBanRole) {
            return interaction.reply({
                content: '❌ You do not have permission to use `/ban`.',
                ephemeral: true,
            });
        }

        const user = interaction.options.getUser('target');
        const reason =
            interaction.options.getString('reason') ||
            'No reason provided';

        if (!user) {
            throw new TitanBotError(
                'Missing target user',
                ErrorTypes.USER_INPUT,
                'You must specify a user to ban.',
                { subtype: 'invalid_user' },
            );
        }

        if (user.id === interaction.user.id) {
            throw new TitanBotError(
                'Cannot ban self',
                ErrorTypes.VALIDATION,
                'You cannot ban yourself.',
            );
        }

        if (user.id === client.user.id) {
            throw new TitanBotError(
                'Cannot ban bot',
                ErrorTypes.VALIDATION,
                'You cannot ban the bot.',
            );
        }

        // DM the user before banning them
        try {
            await user.send({
                embeds: [
                    successEmbed(
                        `🚫 You have been banned from ${interaction.guild.name}`,
                        `**Reason:** ${reason}\n\nIf you believe this ban was made in error, please contact the server staff in https://discord.gg/kPbq7WajWF`,
                    ),
                ],
            });
        } catch (error) {
            console.log(
                `Could not DM ${user.tag} (${user.id}) about their ban.`
            );
        }

        const result = await ModerationService.banUser({
            guild: interaction.guild,
            user,
            moderator: member,
            reason,
        });

        await InteractionHelper.universalReply(interaction, {
            embeds: [
                successEmbed(
                    `🚫 **Banned** ${user.tag}`,
                    `**Reason:** ${reason}\n**Case ID:** #${result.caseId}`,
                ),
            ],
        });
    },
};
