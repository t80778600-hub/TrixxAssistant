import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ModerationService } from '../../services/moderation/moderationService.js';

const durationChoices = [
    { name: "1 minute", value: "1m" },
    { name: "5 minutes", value: "5m" },
    { name: "10 minutes", value: "10m" },
    { name: "30 minutes", value: "30m" },
    { name: "1 hour", value: "1h" },
    { name: "3 hours", value: "3h" },
    { name: "6 hours", value: "6h" },
    { name: "12 hours", value: "12h" },
    { name: "1 day", value: "1d" },
    { name: "7 days", value: "7d" },
];

function parseDuration(duration) {
    const match = duration.match(/^(\d+)(m|h|d)$/i);

    if (!match) {
        return null;
    }

    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case "m":
            return amount * 60 * 1000;

        case "h":
            return amount * 60 * 60 * 1000;

        case "d":
            return amount * 24 * 60 * 60 * 1000;

        default:
            return null;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a user for a specific duration.")
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("User to timeout")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("duration")
                .setDescription("Duration of the timeout")
                .setRequired(true)
                .addChoices(...durationChoices),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for the timeout"),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: "moderation",

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);

        if (!deferSuccess) {
            logger.warn(`Timeout interaction defer failed`, {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                commandName: 'timeout',
            });
            return;
        }

        const targetUser = interaction.options.getUser("target");
        const member = interaction.options.getMember("target");
        const duration = interaction.options.getString("duration");
        const reason =
            interaction.options.getString("reason") || "No reason provided";

        if (!targetUser) {
            throw new TitanBotError(
                'Missing target user',
                ErrorTypes.USER_INPUT,
                'You must specify a user to timeout.',
                { subtype: 'invalid_user' },
            );
        }

        if (targetUser.id === interaction.user.id) {
            throw new TitanBotError(
                "Cannot timeout self",
                ErrorTypes.VALIDATION,
                "You cannot timeout yourself.",
            );
        }

        if (targetUser.id === client.user.id) {
            throw new TitanBotError(
                "Cannot timeout bot",
                ErrorTypes.VALIDATION,
                "You cannot timeout the bot.",
            );
        }

        if (!member) {
            throw new TitanBotError(
                "Target not found",
                ErrorTypes.USER_INPUT,
                "The target user is not currently in this server.",
            );
        }

        const durationMs = parseDuration(duration);

        if (!durationMs) {
            throw new TitanBotError(
                "Invalid duration",
                ErrorTypes.USER_INPUT,
                "Invalid duration. Use values such as 1m, 1h, or 1d.",
            );
        }

        const durationDisplay =
            durationChoices.find((c) => c.value === duration)?.name ||
            duration;

        // DM the user before applying the timeout
        try {
            await targetUser.send({
                embeds: [
                    successEmbed(
                        `⏳ You have been timed out in ${interaction.guild.name}`,
                        `**Duration:** ${durationDisplay}\n**Reason:** ${reason}\n\nYou will be able to chat again once your timeout expires.`,
                    ),
                ],
            });
        } catch (error) {
            // User has DMs disabled, blocked the bot, etc.
            logger.warn(`Could not DM ${targetUser.tag} about timeout`, {
                userId: targetUser.id,
                guildId: interaction.guildId,
                error: error.message,
            });
        }

        const result = await ModerationService.timeoutUser({
            guild: interaction.guild,
            member,
            moderator: interaction.member,
            durationMs,
            reason,
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [
                successEmbed(
                    `⏳ **Timed out** ${targetUser.tag} for ${durationDisplay}.`,
                    `**Reason:** ${reason}\n**Case ID:** #${result.caseId}`,
                ),
            ],
        });
    },
};
