const { PermissionFlagsBits } = require('discord.js');
const { setVipRole } = require('../utils/db');

module.exports = {
    name: 'setviprole',
    description: 'Define o cargo VIP do servidor',
    async run({ message, args }) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Comando apenas para Administradores.');
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) return message.reply('❌ Mencione o cargo VIP. Exemplo: `!setviprole @VIP`');

        setVipRole(message.guild.id, role.id);
        message.reply(`✅ Cargo **${role.name}** registrado como cargo VIP oficial!`);
    }
};
