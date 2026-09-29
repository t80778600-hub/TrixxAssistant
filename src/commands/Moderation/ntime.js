import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ntime')
        .setDescription('Display ticket support hours'),

    category: 'utility',

    async execute(interaction, config, client) {
        const embed = new EmbedBuilder()
            .setColor('#E94343')
            .setTitle('Ticket Support Hours')
            .setDescription(
                'You are currently outside of our ticket support hours.\n\n' +
                '**Our Ticket Hours:**\n' +
                '10:00 AM - 12:00 AM AEST\n\n' +
                'Please wait patiently. A staff member will review your ticket ' +
                'and respond as soon as they are available.\n\n' +
                '**Note:** These hours are a guide. Staff members may still be ' +
                'available outside of these times.\n\n' +
                'Thank you for your patience!'
            )
            .setFooter({
                text: 'OCE Creative Hub | Support'
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    },
};
