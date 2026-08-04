const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'removevip',
    description: 'Remove cargo VIP de um usuário',
    async run({ message, vipRoleId }) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        if (!vipRoleId) return message.reply('❌ Cargo VIP não configurado.');

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Uso: `!removevip @usuario`');

        await member.roles.remove(vipRoleId);
        message.reply(`✅ Cargo VIP removido de ${member.user}.`);
    }
};
