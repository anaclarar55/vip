const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'addvip',
    description: 'Adiciona cargo VIP a um usuário',
    async run({ message, vipRoleId }) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        if (!vipRoleId) return message.reply('❌ Configure o cargo primeiro usando `!setviprole @cargo`.');

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Uso: `!addvip @usuario`');

        await member.roles.add(vipRoleId);
        message.reply(`🎉 Cargo VIP concedido para ${member.user}!`);
    }
};
