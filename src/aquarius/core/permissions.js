const debug = require('debug');
const client = require('./client');
const users = require('./users');
const settings = require('../settings/settings');

const log = debug('Permissions');

const LEVELS = {
  ADMIN: 2,
  RESTRICTED: 1,
  ALL: 0,
};

function isBotOwner(user) {
  return user.id === process.env.OWNER_ID;
}

function isGuildAdmin(guild, user) {
  const guildMember = guild.members.find('id', user.id);

  if (guildMember === null || guildMember === undefined) {
    log(`ERROR: No Member found for ${user.username} in ${guild.name}.`);
    return isBotOwner(user);
  }

  return isBotOwner(user) || guildMember.hasPermission('ADMINISTRATOR');
}

function isGuildModerator(guild, user) {
  if (isGuildAdmin(guild, user)) {
    return true;
  }

  const nameRole = users.hasRole(guild, user, `${client.user.name} Mod`);
  const nickRole = users.hasRole(guild, user, `${users.getNickname(guild, client.user)} Mod`);

  return nameRole || nickRole;
}

function isGuildMuted(guild, user) {
  if (isGuildAdmin(guild, user)) {
    return false;
  }

  const nameRole = users.hasRole(guild, user, `${client.user.name} Muted`);
  const nickRole = users.hasRole(guild, user, `${users.getNickname(guild, client.user)} Muted`);

  return nameRole || nickRole;
}

function isCommandEnabled(guild, command) {
  return [...settings.getCommands(guild.id)].includes(command.constructor.name);
}

function hasPermission(guild, user, command) {
  const permission = settings.getPermission(guild.id, command.constructor.name);

  switch (permission) {
    case LEVELS.ADMIN:
      return isGuildAdmin(guild, user);
    case LEVELS.RESTRICTED:
      return isGuildModerator(guild, user);
    case LEVELS.ALL:
      return true;
    default:
      return false;
  }
}

module.exports = {
  LEVELS,
  isBotOwner,
  isGuildAdmin,
  isGuildModerator,
  isGuildMuted,
  isCommandEnabled,
  hasPermission,
};
