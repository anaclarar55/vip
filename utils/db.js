const fs = require('fs');
const path = './database.json';

function getDB() {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify({ guilds: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getVipRole(guildId) {
    const db = getDB();
    return db.guilds[guildId]?.vipRoleId || null;
}

function setVipRole(guildId, roleId) {
    const db = getDB();
    if (!db.guilds[guildId]) db.guilds[guildId] = {};
    db.guilds[guildId].vipRoleId = roleId;
    saveDB(db);
}

// Salva e busca o cargo exclusivo do usuário
function getUserRole(guildId, userId) {
    const db = getDB();
    return db.guilds[guildId]?.userRoles?.[userId] || null;
}

function setUserRole(guildId, userId, roleId) {
    const db = getDB();
    if (!db.guilds[guildId]) db.guilds[guildId] = {};
    if (!db.guilds[guildId].userRoles) db.guilds[guildId].userRoles = {};
    db.guilds[guildId].userRoles[userId] = roleId;
    saveDB(db);
}

// Salva e busca a call exclusiva do usuário
function getUserCall(guildId, userId) {
    const db = getDB();
    return db.guilds[guildId]?.userCalls?.[userId] || null;
}

function setUserCall(guildId, userId, channelId) {
    const db = getDB();
    if (!db.guilds[guildId]) db.guilds[guildId] = {};
    if (!db.guilds[guildId].userCalls) db.guilds[guildId].userCalls = {};
    db.guilds[guildId].userCalls[userId] = channelId;
    saveDB(db);
}

module.exports = { 
    getVipRole, 
    setVipRole, 
    getUserRole, 
    setUserRole, 
    getUserCall, 
    setUserCall 
};
