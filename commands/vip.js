const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'vip',
    description: 'Painel de controle VIP',
    async run({ message, vipRoleId }) {
        const isVip = vipRoleId && message.member.roles.cache.has(vipRoleId);
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isVip && !isAdmin) {
            return message.reply('❌ Você precisa ter o cargo VIP para acessar este painel!');
        }

        const embed = new EmbedBuilder()
            .setTitle('💎 Painel de Controle VIP')
            .setDescription('Gerencie as vantagens do seu VIP utilizando os botões abaixo:')
            .addFields(
                { name: '🏷️ Seu Cargo VIP', value: 'Crie ou altere o nome e a cor do seu cargo exclusivo.', inline: false },
                { name: '🎙️ Sua Call VIP', value: 'Crie ou altere o nome e o limite de vagas da sua call.', inline: false },
                { name: '👥 Gerenciar Membros', value: 'Adicione ou remova amigos da sua tag (dando acesso à sua call).', inline: false }
            )
            .setColor('#FFD700')
            .setFooter({ text: 'Sistema VIP • Selecione uma opção' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_vip_role')
                .setLabel('Gerenciar Cargo')
                .setEmoji('🏷️')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('btn_vip_call')
                .setLabel('Gerenciar Call')
                .setEmoji('🎙️')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('btn_vip_members')
                .setLabel('Gerenciar Membros')
                .setEmoji('👥')
                .setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
};
