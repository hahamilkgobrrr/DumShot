const Discord = require('discord.js');
const express = require("express");
const app = express();
const bot = new Discord.Client();
const ms = require('ms');
const { Permissions } = require('discord.js');

const { Client, WebhookClient } = require('discord.js');

bot.on('ready', () => {
  let serversIn = bot.guilds.cache.size;
  console.info(`Logged in as ${bot.user.tag}, bot online`);
  bot.user.setPresence({ activity: { name: `${serversIn} Servers`, type: "WATCHING" }, status: 'online' })
    .catch(console.error);
});

const PREFIX = "$";

bot.on('message', async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.content.startsWith(PREFIX)) {
    const [CMD_NAME, ...args] = message.content
      .trim()
      .substring(PREFIX.length)
      .split(/\s+/);
    if (CMD_NAME === 'ban') {
      //perm checking [IMPORTANT]
      if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You don't have permission to perform this command");
      if (!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("I don't have enough permissions!")
      if (message.member.id === message.author.id) return message.channel.send("You cannot ban yourself!");

      //variables
      let reason = args.slice(1).join(" ");
      const mentionedMember = message.mentions.members.first();

      //input checking
      if (!reason) reason = 'Please provide a reason!';
      if (!args[0]) return message.channel.send("Please mention a user to ban \`$unban @user {reason}\`");
      if (!mentionedMember) return message.channel.send(`Could not find ${mentionedMember}.`);
      if (!mentionedMember.bannable) return message.channel.send("I can't ban this user.")

      //executing
      const banEmbed = new Discord.MessageEmbed()
        .setTitle(`You have been banned from ${message.guild.name}`)
        .setDescription(`Reason: ${reason}`)
        .setColor("#F80707")
        .setTimestamp();

      await mentionedMember.send(banEmbed).catch(err => console.log(err));
      await mentionedMember.ban({
        days: 7,
        reason: reason
      }).catch(err => console.log(err)).then(() => message.channel.send("Banned " + mentionedMember.user.tag));

    } else if (CMD_NAME === 'unban') {
      //perm checking [IMPORTANT]
      if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You don't have permission to perform this command");
      if (!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("I don't have enough permissions!")

      //variables
      let reason = args.slice(1).join(" ");
      let userID = args[0];

      //input checking
      if (!reason) reason = 'Please provide a reason!';
      if (!args[0]) return message.channel.send("Please mention a user to unban `\`$ban ID {reason}\`");
      if (isNaN(args[0])) return message.channel.send("Please provide an valid id!\`$unban ID reason\`");

      //executing
      message.guild.fetchBans().then(async bans => {
        if (bans.size == 0) return message.channel.send("Theres no people banned on this server!");
        let bUser = bans.find(b => b.user.id == userID);
        if (!bUser) return message.channel.send("This user is not banned.");
        await message.guild.members.unban(bUser.user, reason).catch(err => {
          console.log(err);
          return message.channel.send("Something went wrong while unbanning this user...");
        }).then(() => {
          message.channel.send(`${args[0]} Was unbanned.`);
        })
      })


    } else if (CMD_NAME === 'ping') {
      message.channel.send("`Pinging...`").then(msg => {
        const ping = msg.createdTimestamp - message.createdTimestamp;
        msg.edit(`Pong! ${ping}ms`);
      })


    } else if (CMD_NAME === 'avatar') {
      if (args[0]) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention a user to get the avatar from.');

        const otherIconEmbed = new Discord.MessageEmbed()
          .setTitle(`${user.username}'s avatar`)
          .setImage(user.displayAvatarURL());

        return message.channel.send(otherIconEmbed).catch(err => console.log(err));
      }

      const myIconEmbed = new Discord.MessageEmbed()
        .setTitle(`${message.author.username}'s avatar`)
        .setImage(message.author.displayAvatarURL());

      return message.channel.send(myIconEmbed).catch(err => console.log(err));


    } else if (CMD_NAME === 'userinfo') {
      let mentionedMember = message.mentions.members.first();
      let mentionedUser = message.mentions.users.first();

      const userEmbed = new Discord.MessageEmbed()
        .setTitle(`userinfo of ${mentionedUser.username}`)
        .addField('username ', `${mentionedUser.username}`)
        .addField('User ID ', `${mentionedUser.ID}`)
        .addField('Account Created ', `${mentionedUser.createdAt}`)
        .addField('Joined At ', `${mentionedMember.joinedAt}`)

      message.channel.send(userEmbed).catch(err => console.log(err));


    } else if (CMD_NAME === 'purge') {
      if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You cannot perform this command.");
      if (!message.guild.me.hasPermission("MANAGE_MESSAGES")) return message.channel.send("I don't have enough permissions")
      if (!args[0]) return message.channel.send("Please insert a valid number to purge. \`${PREFIX}purge {number}\`");
      const amountToDelete = Number(args[0], 10);

      if (isNaN(amountToDelete)) return message.channel.send("Invalid Number");
      if (!Number.isInteger(amountToDelete)) return message.channel.send("Number cannot contain , or .");
      if (!amountToDelete || amountToDelete < 1 || amountToDelete > 500) return message.channel.send("The number stated must be 1-500.");
      const fetched = message.channel.messages.fetch({
        limit: amountToDelete
      });

      try {
        message.delete();
        await message.channel.bulkDelete(amountToDelete)
          .then(messages => message.channel.send(`Deleted ${amountToDelete} Messages.`))
      } catch (err) {
        console.log(err);
        message.channel.send(`Unable to delete messages, make sure messages are within 14 days old`)
      }


    } else if (CMD_NAME === 'lock') {
      if (!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You don't have permission to use this command.");
      if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) return message.channel.send("I do not have enough permissions to perform this command.");

      let everyone = message.guild.roles.everyone;
      const role = message.guild.roles.cache.get(message.guild.id)
      console.log(role);
      let lockchannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
      if (!lockchannel) lockchannel = message.channel;

      await lockchannel.updateOverwrite(role, {
        SEND_MESSAGES: false
      }).catch(err => console.log(err));
      message.channel.send(`Locked ${lockchannel} :lock: `);


    } else if (CMD_NAME === 'unlock') {
      if (!message.member.hasPermission("MANAGE_CHANNELS")) return message.channel.send("You don't have permission to use this command.");
      if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) return message.channel.send("I do not have enough permissions to perform this command.");

      let everyone = message.guild.roles.everyone;
      const role = message.guild.roles.cache.get(message.guild.id)
      console.log(role);
      let lockchannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
      if (!lockchannel) lockchannel = message.channel;

      await lockchannel.updateOverwrite(role, {
        SEND_MESSAGES: null
      }).catch(err => console.log(err));
      message.channel.send(`Unlocked ${lockchannel} :unlock: `);


    } else if (CMD_NAME === 'tempban') {
      if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You do not have enough permissions for this command.");
      if (!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("I do not have enough permissions to ban people.")

      const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      let reason = args.slice(2).join(" ");
      let time = args[1];
      const banEmbed = new Discord.MessageEmbed()
        .setTitle(`You have been tempbanned from ${message.guild.name}`)
        .addField(`Reason: ${reason}`, `duration: ${time}`)
        .setColor("#F80707")
        .setTimestamp();

      if (!args[0]) return message.channel.send("Please state a user to tempban.");
      if (!mentionedMember) return message.channel.send("This user is not in this server.");
      if (!mentionedMember.bannable) return message.channel.send("I cannot ban this user.");
      if (!mentionedMember.roles.highest.position >= message.member.roles.highest.position) return message.channel.send("You cannot ban this user.");
      if (!reason) reason = ("No reason given");
      if (!time) return message.channel.send("Please state how long this user will be banned for. \`$tempban @user 7d reason\`");

      await mentionedMember.send(banEmbed).catch(err => console.log(err));
      await mentionedMember.ban({
        days: 7,
        reason: reason
      }).catch(err => console.log(err));

      setTimeout(async function() {
        await message.guild.fetchBans().then(async bans => {
          if (bans.size == 0) return message.channel.send("This server does not have any bans.");
          let bannedUser = bans.find(b => b.user.id == mentionedMember.id);
          if (!bannedUser) return console.log("Member unbanned");
          await message.guild.members.unban(bannedUser.user, reason).catch(err => console.log(err));
        })
      }, ms(time));

    } else if (CMD_NAME === 'mute') {
      if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("You do not have permission to perform this command");
      if (!message.guild.me.hasPermission("MUTE_MEMBERS")) return message.channel.send("I do not have enough permission to do this");

      //variables
      let role = message.guild.roles.cache.find(x => x.name === "Muted");
      if (!role) {
        try {
          role = await message.guild.roles.create({
            data: {
              name: "Muted",
              color: "#000000",
              permissions: [],
              position: 2
            },
          })
          message.guild.channels.cache.forEach(async (channel) => {
            channel.createOverwrite(role, {
              SEND_MESSAGES: false,
              ADD_REACTIONS: false,
              SEND_TTS_MESSAGES: false,
              ATTACH_FILES: false,
              SPEAK: false
            });
          });
        } catch (err) { console.log(err) }
      }
      const muteRole = message.guild.roles.cache.get(role.id);
      const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      let reason = args.slice(1).join(" ");
      const muteEmbed = new Discord.MessageEmbed()
        .setTitle(`You have been muted in ${message.guild.name}`)
        .addField(`Reason: ${reason}`)
        .setColor("#F80707")
        .setTimestamp();

      if (!args[0]) return message.channel.send(`Invalid: \`$mute @user reason\` `)
      if (!mentionedMember) return message.channel.send('Please mention a valid member');
      if (mentionedMember.user.id == message.author.id) return message.channel.send("You cannot mute yourselfs!");
      if (mentionedMember.user.id == bot.user.id) return message.channel.send("I aint mutin' myself");
      if (!reason) reason = 'No reason given.';
      if (mentionedMember.roles.cache.has(muteRole.id)) return message.channel.send("This user is already muted.");
      if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot mute this user.');

      await mentionedMember.send(muteEmbed).catch(err => console.log(err));
      await mentionedMember.roles.add(muteRole.id).catch(err => console.log(err).then(message.channel.send("There was an issue giving this user the muted role.")));

      const mutenotifEmbed = new Discord.MessageEmbed()
        .setTitle(`${mentionedMember.id} Has been muted`)
        .addField(`Reason: ${reason}`)
        .setColor("#F80707")
        .setTimestamp()
        .setFooter(`Command executed by ${message.author}`);

      await message.channel.send(mutenotifEmbed);

    } else if (CMD_NAME === 'unmute') {
      if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("You do not have permission to perform this command");
      if (!message.guild.me.hasPermission("MUTE_MEMBERS")) return message.channel.send("I do not have enough permission to do this");

      //variables
      let role = message.guild.roles.cache.find(x => x.name === "Muted");
      const muteRole = message.guild.roles.cache.get(role.id);
      const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      let reason = args.slice(1).join(" ");
      const unmuteEmbed = new Discord.MessageEmbed()
        .setTitle(`You have been unmuted in ${message.guild.name}`)
        .addField(`Reason: ${reason}`)
        .setColor("#F80707")
        .setTimestamp();

      if (!args[0]) return message.channel.send(`Invalid: \`$unmute @user reason\` `)
      if (!mentionedMember) return message.channel.send('Please mention a valid member');
      if (mentionedMember.user.id == message.author.id) return message.channel.send("You cannot mute yourselfs!");
      if (mentionedMember.user.id == bot.user.id) return message.channel.send("idk if unmuting the bot is really a option...");
      if (!reason) reason = 'No reason given.';
      if (mentionedMember.roles.cache.has(!muteRole.id)) return message.channel.send("This user is already unmuted.");
      if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot unmute this user.');
      await mentionedMember.send(unmuteEmbed).catch(err => console.log(err));
      await mentionedMember.roles.remove(muteRole.id).catch(err => console.log(err).then(message.channel.send("There was an issue unmuting this user.")));

      const unmutenotifEmbed = new Discord.MessageEmbed()
        .setTitle(`${mentionedMember.id} Has been unmuted`)
        .addField(`Reason: ${reason}`)
        .setColor("#F80707")
        .setTimestamp()
        .setFooter(`Command executed by ${message.author}`);
      await message.channel.send(unmutenotifEmbed);
    } else if (CMD_NAME === 'vote') {
      const filter = m => m.author.id == message.author.id;
      let embed = new Discord.MessageEmbed()
      .setFooter(`Executed by ${message.author.tag}`);

      message.channel.send('Please send the `title`');
      try {
        let msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
        console.log(msg.first().content);
        embed.setTitle(msg.first().content);
      } catch (err) {
        console.log(err);
        message.channel.send("`Ran out of time, re-run command.`")
      }

      message.channel.send('Please state the `first option`');
      try {
        let msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
        console.log(msg.first().content);
        embed.addField(`[🔴] 1. `, msg.first().content);
      } catch (err) {
        console.log(err);
        message.channel.send("`Ran out of time, re-run command.`")
      }

      message.channel.send('Please state the `second option`');
      try {
        let msg = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
        console.log(msg.first().content);
        embed.addField(`[🔵 ] 2. `, msg.first().content);
      } catch (err) {
        console.log(err);
        message.channel.send("`Ran out of time, re-run command.`")
      }
      message.channel.send(embed).then(sendMessage => sendMessage.react('🔴')).then(reaction => reaction.message.react('🔵'));
    }
  }
})
require('./server')();
bot.login('Replace this with your bot token');
