import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

const GLOBALBAN_ROLE_ID = "1543929707798470676";

export default {
    data: new SlashCommandBuilder()
        .setName("globalunban")
        .setDescription("Globally unban a user")
        .addStringOption(option =>
            option
                .setName("userid")
                .setDescription("User ID")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason for the unban")
                .setRequired(false)
        ),

    category: "moderation",

    async execute(interaction, config, client) {
        if (!interaction.member.roles.cache.has(GLOBALBAN_ROLE_ID)) {
            throw new TitanBotError(
                "No Permission",
                ErrorTypes.VALIDATION,
                "You do not have permission to use this command."
            );
        }

        const userId = interaction.options.getString("userid");
        const reason =
            interaction.options.getString("reason") || "No reason provided";

        await InteractionHelper.safeDefer(interaction);

        let unbanned = 0;

        for (const guild of client.guilds.cache.values()) {
            try {
                if (!guild.members.me) continue;

                const banned = await guild.bans.fetch(userId).catch(() => null);

                if (!banned) continue;

                await guild.members.unban(
                    userId,
                    `GLOBAL UNBAN | ${reason}`
                );

                unbanned++;
            } catch {
                continue;
            }
        }

        try {
            const user = await client.users.fetch(userId);

            await user.send({
                embeds: [
                    successEmbed(
                        "✅ Global Unban",
                        `You have been **globally unbanned** from the **OCE Creative Hub servers**.\n\n` +
                        `**Reason:** ${reason}`
                    ),
                ],
            });
        } catch {}

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [
                successEmbed(
                    "✅ Global Unban Complete",
                    `**User:** <@${userId}>\n` +
                    `**Reason:** ${reason}\n` +
                    `**Servers Unbanned:** ${unbanned}`
                ),
            ],
        });
    },
};
