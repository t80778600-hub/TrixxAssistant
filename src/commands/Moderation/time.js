import { EmbedBuilder } from 'discord.js';

export default {
    name: 'ntime',
    description: 'Display ticket support hours',

    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#E94343')
            .setTitle('Ticket Support Hours')
            .setDescription(
                'You are currently outside of our ticket support hours.\n\n' +
                '**Our Ticket Hours:**\n' +
                '10:00 AM - 12:00 AM AEST\n\n' +
                'Please wait patiently. A staff member will review your ticket ' +
                'and respond as soon as they are available.\n\n' +
                '**Note:** These hours are a guide. Staff members may still ' +
                'be available outside of these times.\n\n' +
                'Thank you for your patience!'
            )
            .setFooter({
                text: 'OCE Creative Hub | Support'
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });
    }
};
