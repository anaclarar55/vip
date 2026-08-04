const { 
    Client, GatewayIntentBits, Collection, ModalBuilder, TextInputBuilder, 
    TextInputStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType,
    UserSelectMenuBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { 
    getVipRole, getUserRole, setUserRole, getUserCall, setUserCall 
} = require('./utils/db');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = '!';
client.commands = new Collection();

// Carregando comandos
const commandPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandPath)) {
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.name) client.commands.set(command.name, command);
    }
}

client.on('ready', () => {
    console.log(`🤖 Bot VIP ligado como ${client.user.tag}!`);
});

// Leitor de Comandos
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    const vipRoleId = getVipRole(message.guild.id);

    try {
        await command.run({ client, message, args, PREFIX, vipRoleId });
    } catch (error) {
        console.error(error);
        message.reply('❌ Ocorreu um erro ao executar o comando.');
    }
});

// Listener de Interações (Botões, Modais e Menus)
client.on('interactionCreate', async (interaction) => {
    try {
        const vipRoleId = getVipRole(interaction.guild.id);
        const isVip = vipRoleId && interaction.member.roles.cache.has(vipRoleId);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isVip && !isAdmin) {
            return interaction.reply({ content: '❌ Apenas membros VIP têm acesso a esses botões.', ephemeral: true });
        }

        // ==========================================
        // 🔘 CLIQUE NOS BOTÕES
        // ==========================================
        if (interaction.isButton()) {

            // 1. Botão Gerenciar Cargo
            if (interaction.customId === 'btn_vip_role') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_vip_role')
                    .setTitle('Gerenciar Meu Cargo VIP');

                const nameInput = new TextInputBuilder()
                    .setCustomId('input_role_name')
                    .setLabel('Nome do seu cargo:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: ✨ VIP Supreme')
                    .setRequired(true);

                const colorInput = new TextInputBuilder()
                    .setCustomId('input_role_color')
                    .setLabel('Cor HEX (Ex: #FF0000):')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('#FF0000')
                    .setMaxLength(7)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(colorInput)
                );

                return await interaction.showModal(modal);
            }

            // 2. Botão Gerenciar Call
            if (interaction.customId === 'btn_vip_call') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_vip_call')
                    .setTitle('Gerenciar Minha Call VIP');

                const nameInput = new TextInputBuilder()
                    .setCustomId('input_call_name')
                    .setLabel('Nome da sua call:')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: 🔊 Cantinho do VIP')
                    .setRequired(true);

                const limitInput = new TextInputBuilder()
                    .setCustomId('input_call_limit')
                    .setLabel('Limite de pessoas (0 = Ilimitado):')
                    .setStyle(TextInputStyle.Short)
                    .setValue('0')
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(limitInput)
                );

                return await interaction.showModal(modal);
            }

            // 3. Botão Gerenciar Membros (Abre a Lista Nativa do Discord para escolher o amigo)
            if (interaction.customId === 'btn_vip_members') {
                const userRoleId = getUserRole(interaction.guild.id, interaction.user.id);
                if (!userRoleId) {
                    return await interaction.reply({ 
                        content: '❌ Você precisa criar o seu **Cargo VIP** primeiro! Clique em **Gerenciar Cargo**.', 
                        ephemeral: true 
                    });
                }

                // Cria o menu nativo de selecionar usuários
                const userSelect = new UserSelectMenuBuilder()
                    .setCustomId('select_vip_member')
                    .setPlaceholder('Selecione um membro do servidor...')
                    .setMinValues(1)
                    .setMaxValues(1);

                const row = new ActionRowBuilder().addComponents(userSelect);

                return await interaction.reply({
                    content: '👥 **Selecione o amigo** que você quer adicionar ou remover da sua tag:',
                    components: [row],
                    ephemeral: true
                });
            }
        }

        // ==========================================
        // 👥 RESPOSTA DA SELEÇÃO DE USUÁRIO (DROPDOWN)
        // ==========================================
        if (interaction.isUserSelectMenu() && interaction.customId === 'select_vip_member') {
            await interaction.deferReply({ ephemeral: true });

            const targetId = interaction.values[0];
            const userRoleId = getUserRole(interaction.guild.id, interaction.user.id);
            const role = interaction.guild.roles.cache.get(userRoleId);

            if (!role) {
                return await interaction.editReply({ content: '❌ Seu cargo VIP não foi encontrado no servidor.' });
            }

            try {
                const targetMember = await interaction.guild.members.fetch(targetId);

                if (targetMember.id === interaction.user.id) {
                    return await interaction.editReply({ content: '❌ Você já é o dono da tag!' });
                }

                // Se já tem o cargo, remove. Se não tem, adiciona.
                if (targetMember.roles.cache.has(role.id)) {
                    await targetMember.roles.remove(role);
                    return await interaction.editReply({ 
                        content: `🗑️ O usuário **${targetMember.user.tag}** foi **removido** da sua tag (${role.name}) e perdeu acesso à sua call.` 
                    });
                } else {
                    await targetMember.roles.add(role);
                    return await interaction.editReply({ 
                        content: `✅ O usuário **${targetMember.user.tag}** recebeu a sua tag (**${role.name}**) e agora pode entrar na sua call!` 
                    });
                }
            } catch (err) {
                console.error(err);
                return await interaction.editReply({ content: '❌ Não foi possível alterar o cargo deste usuário.' });
            }
        }

        // ==========================================
        // 📝 RESPOSTA DOS FORMULÁRIOS (MODAIS)
        // ==========================================
        if (interaction.isModalSubmit()) {

            await interaction.deferReply({ ephemeral: true });

            // 🏷️ CRIAR / EDITAR CARGO VIP
            if (interaction.customId === 'modal_vip_role') {
                const roleName = interaction.fields.getTextInputValue('input_role_name');
                const roleColor = interaction.fields.getTextInputValue('input_role_color');

                if (roleColor && !/^#[0-9A-F]{6}$/i.test(roleColor)) {
                    return await interaction.editReply({ content: '❌ Cor inválida! Use formato HEX (Ex: `#FF0000`).' });
                }

                try {
                    const existingRoleId = getUserRole(interaction.guild.id, interaction.user.id);
                    let role = existingRoleId ? interaction.guild.roles.cache.get(existingRoleId) : null;

                    if (role) {
                        await role.setName(roleName);
                        if (roleColor) await role.setColor(roleColor);
                    } else {
                        role = await interaction.guild.roles.create({
                            name: roleName,
                            color: roleColor || '#FFFFFF',
                            position: interaction.guild.members.me.roles.highest.position - 1,
                            reason: `Cargo exclusivo de ${interaction.user.tag}`
                        });

                        await interaction.member.roles.add(role);
                        setUserRole(interaction.guild.id, interaction.user.id, role.id);
                    }

                    return await interaction.editReply({ 
                        content: `✅ **Seu cargo VIP foi configurado com sucesso!**\n🏷️ **Nome:** ${roleName}\n🎨 **Cor:** ${roleColor || 'Padrão'}` 
                    });
                } catch (err) {
                    console.error(err);
                    return await interaction.editReply({ content: '❌ Erro ao criar/editar o cargo. Lembre-se de deixar o cargo do BOT no topo!' });
                }
            }

            // 🎙️ CRIAR / EDITAR CALL VIP
            if (interaction.customId === 'modal_vip_call') {
                const callName = interaction.fields.getTextInputValue('input_call_name');
                const limitStr = interaction.fields.getTextInputValue('input_call_limit') || '0';
                const limit = parseInt(limitStr);

                if (isNaN(limit) || limit < 0 || limit > 99) {
                    return await interaction.editReply({ content: '❌ O limite deve ser um número entre 0 e 99.' });
                }

                try {
                    const userRoleId = getUserRole(interaction.guild.id, interaction.user.id);
                    const existingChannelId = getUserCall(interaction.guild.id, interaction.user.id);
                    let channel = existingChannelId ? interaction.guild.channels.cache.get(existingChannelId) : null;

                    const overwrites = [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.Connect] },
                        { 
                            id: interaction.user.id, 
                            allow: [
                                PermissionFlagsBits.Connect, 
                                PermissionFlagsBits.Speak, 
                                PermissionFlagsBits.ManageChannels
                            ] 
                        }
                    ];

                    if (userRoleId) {
                        overwrites.push({
                            id: userRoleId,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
                        });
                    }

                    if (channel) {
                        await channel.setName(callName);
                        await channel.setUserLimit(limit);
                        await channel.permissionOverwrites.set(overwrites);
                    } else {
                        channel = await interaction.guild.channels.create({
                            name: callName,
                            type: ChannelType.GuildVoice,
                            userLimit: limit,
                            permissionOverwrites: overwrites
                        });

                        setUserCall(interaction.guild.id, interaction.user.id, channel.id);
                    }

                    return await interaction.editReply({ 
                        content: `🎙️ **Sua call VIP foi configurada!**\n📍 **Canal:** <#${channel.id}>\n👥 **Limite:** ${limit === 0 ? 'Ilimitado' : limit + ' pessoas'}` 
                    });
                } catch (err) {
                    console.error(err);
                    return await interaction.editReply({ content: '❌ Ocorreu um erro ao criar ou atualizar a call.' });
                }
            }
        }
    } catch (error) {
        console.error('Erro na interação:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
