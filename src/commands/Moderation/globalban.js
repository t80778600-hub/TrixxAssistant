import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

const GLOBALBAN_ROLE_ID = "1543929707798470676";

export default {
    data: new SlashCommandBuilder()
        .setName("globalban")
        .setDescription("Permanently ban a user from all OCE Creative Hub servers.")
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("User to globally ban")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for the global ban")
                .setRequired(true),
        ),

    category: "moderation",

    async execute(interaction, config, client) {

        // Check Global Ban role
        if (!interaction.member.roles.cache.has(GLOBALBAN_ROLE_ID)) {
            throw new TitanBotError(
                "Missing global ban role",
                ErrorTypes.PERMISSION,
                "You do not have permission to use the global ban command.",
            );
        }

        const targetUser = interaction.options.getUser("target");
        const reason =
            interaction.options.getString("reason") ||
            "No reason provided";

        if (!targetUser) {
            throw new TitanBotError(
                "Missing target user",
                ErrorTypes.USER_INPUT,
                "You must specify a user to global ban.",
            );
        }

        if (targetUser.id === interaction.user.id) {
            throw new TitanBotError(
                "Cannot global ban self",
                ErrorTypes.VALIDATION,
                "You cannot global ban yourself.",
            );
        }

        if (targetUser.id === client.user.id) {
            throw new TitanBotError(
                "Cannot global ban bot",
                ErrorTypes.VALIDATION,
                "You cannot global ban the bot.",
            );
        }

        // DM the user before banning them
        try {
            await targetUser.send({
                embeds: [
                    successEmbed(
                        "🚫 You Have Been Global Banned",
                        `You Have Been Global Banned From **ALL OCE Creative Hub Servers**.\n\n` +
                        `**Reason:** ${reason}\n\n` +
                        `This is a **PERMANENT BAN**.\n` +
                        `You will **never be unbanned** from OCE Creative Hub servers.`,
                    ),
                ],
            });
        } catch (error) {
            console.log(
                `Could not DM ${targetUser.tag} (${targetUser.id}) about global ban.`,
            );
        }

        let bannedCount = 0;
        let failedCount = 0;

        // Ban from every server the bot is in
        for (const guild of client.guilds.cache.values()) {
            try {
                const botMember = guild.members.me;

                if (!botMember) {
                    failedCount++;
                    continue;
                }

                // Bot needs Ban Members permission
                if (
                    !botMember.permissions.has(
                        PermissionFlagsBits.BanMembers
                    )
                ) {
                    failedCount++;
                    continue;
                }

                // Check if the user is in this server
                const member = await guild.members
                    .fetch(targetUser.id)
                    .catch(() => null);

                if (!member) {
                    continue;
                }

                // Cannot ban the server owner
                if (member.id === guild.ownerId) {
                    failedCount++;
                    continue;
                }

                // Cannot ban users above/equal to bot's highest role
                if (
                    member.roles.highest.position >=
                    botMember.roles.highest.position
                ) {
                    failedCount++;
                    continue;
                }

                await guild.members.ban(targetUser.id, {
                    reason: `GLOBAL BAN | ${reason}`,
                    deleteMessageSeconds: 0,
                });

                bannedCount++;

            } catch (error) {
                failedCount++;

                console.error(
                    `Failed to globally ban ${targetUser.tag} from ${guild.name}:`,
                    error,
                );
            }
        }

        // Tell the moderator the result
        await InteractionHelper.universalReply(interaction, {
            embeds: [
                successEmbed(
                    `🌐 **Globally Banned** ${targetUser.tag}`,
                    `**Reason:** ${reason}\n` +
                    `**Ban Type:** Permanent\n` +
                    `**Servers banned from:** ${bannedCount}\n` +
                    `**Servers failed:** ${failedCount}`,
                ),
            ],
        });
    },
};
