import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';

const GLOBALBAN_ROLE_ID = "1543929707798470676";

export default {
    data: new SlashCommandBuilder()
        .setName("globalunban")
        .setDescription("Globally unban a user from all OCE Creative Hub servers.")
        .addStringOption((option) =>
            option
                .setName("userid")
                .setDescription("The Discord User ID to globally unban")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for the global unban"),
        ),
    category: "moderation",

    async execute(interaction, config, client) {
        // Check if the user has the required Global Ban/Unban role
        if (!interaction.member.roles.cache.has(GLOBALBAN_ROLE_ID)) {
            throw new TitanBotError(
                "Missing Global Ban Role",
                ErrorTypes.VALIDATION,
                "You do not have permission to use this command.",
            );
        }

        const userId = interaction.options.getString("userid");
        const reason =
            interaction.options.getString("reason") ||
            "No reason provided";

        // Make sure the ID is valid
        if (!/^\d{17,20}$/.test(userId)) {
            throw new TitanBotError(
                "Invalid User ID",
                ErrorTypes.USER_INPUT,
                "Please provide a valid Discord User ID.",
            );
        }

        // Defer because the bot may need to check many servers
        const deferSuccess = await InteractionHelper.safeDefer(interaction);

        if (!deferSuccess) {
            return;
        }

        let unbannedCount = 0;
        let failedCount = 0;
        let alreadyUnbannedCount = 0;

        // Go through every server the bot is in
        for (const guild of client.guilds.cache.values()) {
            try {
                const botMember = guild.members.me;

                // Make sure the bot exists in the server
                if (!botMember) {
                    failedCount++;
                    continue;
                }

                // Make sure the bot can ban/unban members
                if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
                    failedCount++;
                    continue;
                }

                // Check if the user is actually banned
                const ban = await guild.bans
                    .fetch(userId)
                    .catch(() => null);

                // User isn't banned in this server
                if (!ban) {
                    alreadyUnbannedCount++;
                    continue;
                }

                // Unban the user
                await guild.members.unban(userId, `GLOBAL UNBAN | ${reason}`);

                unbannedCount++;
            } catch (error) {
                failedCount++;

                console.log(
                    `Could not globally unban ${userId} from ${guild.name}:`,
                    error.message,
                );
            }
        }

        // DM the user
        try {
            const user = await client.users.fetch(userId);

            await user.send({
                embeds: [
                    successEmbed(
                        "✅ You Have Been Globally Unbanned",
                        `You have been **globally unbanned** from the **OCE Creative Hub servers**.\n\n` +
                        `**Reason:** ${reason}\n\n` +
                        `You are now allowed to rejoin OCE Creative Hub servers.`,
                    ),
                ],
            });
        } catch (error) {
            console.log(
                `Could not DM user ${userId} about global unban.`,
            );
        }

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [
                successEmbed(
                    "✅ Global Unban Complete",
                    `**User ID:** ${userId}\n` +
                    `**Reason:** ${reason}\n\n` +
                    `**Servers Unbanned:** ${unbannedCount}\n` +
                    `**Already Unbanned:** ${alreadyUnbannedCount}\n` +
                    `**Failed:** ${failedCount}`,
                ),
            ],
        });
    },
};
```

### How to use it

Once the command is registered, staff with role:

`1543929707798470676`

can use:

```text
/globalunban userid:123456789012345678 reason:Appeal accepted
