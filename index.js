const Discord = require('discord.js');
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const db = require('quick.db');
const fs = require('fs');
const client = new Discord.Client({ intents: [new Discord.Intents().add(32767)] });
const config = require('./config.json');
const InvitesTracker = require('@androz2091/discord-invites-tracker');
const tracker = InvitesTracker.init(client, {
    fetchGuilds: true,
    fetchVanity: true,
    fetchAuditLogs: true
});

client.on('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`)
});

client.on("inviteLogger", (member, invite, inviter) => {
    console.log(inviter)
    db.add(`user_${inviter.id}`, 1);
});

tracker.on('guildMemberAdd', (member, type, invite) => {
    if(type === 'normal'){
      db.add(`user_${invite.inviter.id}`, 1);
    }
});

client.on("messageCreate", async (smithmsg) => {
  if (!smithmsg.content.startsWith(config.prefix) || smithmsg.author.bot)
    return;

  const args = smithmsg.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "spin") {
    const smith_embed = new MessageEmbed()
      .setAuthor({
        name: smithmsg.author.tag,
        iconURL: smithmsg.author.avatarURL(),
      })
      .setTitle(`بواسطة سيرفر ` + smithmsg.guild.name)
      .setDescription(
        `العجلة العادية\nانت تحتاج الى نقطة لتلف العجلة\n\nالعجلة الاسطورية\nانت تحتاج الى ثلاث نقط لتلف العجلة`,
      )
      .setTimestamp()
      .setFooter({
        text: smithmsg.guild.name,
        iconURL: smithmsg.guild.iconURL(),
      });

    const normal_spin_button = new MessageButton()
      .setStyle("SUCCESS")
      .setLabel("العجلة العادية")
      .setCustomId("normal_spin");

    const legend_spin_button = new MessageButton()
      .setStyle("SUCCESS")
      .setLabel("العجلة الأسطورية")
      .setCustomId("legend_spin");

    const close_spin_button = new MessageButton()
      .setStyle("DANGER")
      .setLabel("اغلاق")
      .setCustomId("close_spin");

    const all_button = new MessageActionRow()
      .addComponents(normal_spin_button)
      .addComponents(legend_spin_button)
      .addComponents(close_spin_button);

    smithmsg.channel
      .send({ embeds: [smith_embed], components: [all_button] })
      .then((msg) => {
        const filter = (i) =>
          i.customId.endsWith("_spin") && i.user.id === smithmsg.author.id;

        const collector = smithmsg.channel.createMessageComponentCollector({
          filter,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "close_spin") {
            await msg.delete().catch((err) => {});
            await smithmsg.delete().catch((err) => {});
} else if (i.customId === "normal_spin") {
const points = getPoints(smithmsg.author.id);

if (Number(points) < 1) {
  return i
    .update({
      content: "انت تحتاج الى نقطة لتدور عجلة الحظ!",
      embeds: [],
      components: [],
    })
    .catch((err) => {});
}

const randomSpin =
  config.spin_default[
    Math.floor(Math.random() * config.spin_default.length)
  ];

smithmsg.channel
  .send({
    content: `شوف كدة الجائزة ممكن مش كسبت حاجة (: ولكن لو كسبت انتظر الإدارة تجيك وتسلمك الجائزة\nالشخص الذي سيستلم الجائزة : ${smithmsg.author}\nالجائزة : ||${randomSpin}||`,
  })
  .catch((err) => {});
smithmsg.channel.setName(`${randomSpin}`).catch((err) => {});
updatePoints(smithmsg.author.id, Number(points) - 1);
          } else if (i.customId === "legend_spin") {
            const point = getPoints(smithmsg.author.id);

            if (Number(point) < 3) {
              return i
                .update({
                  content: "انت تحتاج الى ثلاث نقط لتدور عجلة الحظ!",
                  embeds: [],
                  components: [],
                })
                .catch((err) => {});
            }

            const randomSpin =
              config.spin_legends[
                Math.floor(Math.random() * config.spin_legends.length)
              ];

            smithmsg.channel
              .send({
                content: `شوف كدة الجائزة ممكن مش كسبت حاجة (: ولكن لو كسبت انتظر الإدارة تجيك وتسلمك الجائزة\nالشخص الى هيستلم الجائزة : ${smithmsg.author}\nالجائزة : ||${randomSpin}||`,
              })
              .catch((err) => {});
            smithmsg.channel.setName(`${randomSpin}`).catch((err) => {});
            addPoints(smithmsg.author.id, -3);
          }
        });
      });
  } else if (command === "mypoint") {
    var point = getUserData(smithmsg.author.id).points;

    if (!point || point === 0)
      return smithmsg.reply({
        content:
          "مش معاك نقط خالص متزعلش لو عاوز تجيب نقاط جيب انفايت واحد او اكثر",
      });

    smithmsg.reply({ content: `انت تمتلك **${point}** نقطة` });
  } else if (command === "addpoint") {
    if (!args[1] || !smithmsg.mentions.users.first() || isNaN(args[1])) {
      return smithmsg.reply({
        content: `يرجى ادخال الشخص وعدد النقط بشكل صحيح\n${config.prefix}${command} عدد النقط <- الشخص`,
      });
    }

    const mention = smithmsg.mentions.users.first();
    updatePoints(mention.id, Number(args[1]));

    const embed_smith_2 = new MessageEmbed()
      .setAuthor(mention.tag, mention.avatarURL())
      .setDescription(
        `successfully added **${Number(
          args[1],
        )}** to ${mention}\nTotal Point of ${mention.tag}: **${
          getUserData(mention.id).points
        }**`,
      )
      .setColor("GREEN");

    await smithmsg.reply({ embeds: [embed_smith_2] });
  } else if (command === "clearpoint") {
    if (!smithmsg.member.permissions.has("ADMINISTRATOR")) return;

    clearAllPoints();

    const embed_smith_2 = new MessageEmbed()
      .setAuthor(smithmsg.author.tag, smithmsg.author.avatarURL())
      .setDescription(`تم مسح جميع النقاط من جميع الأعضاء`)
      .setColor("GREEN");

    await smithmsg.reply({ embeds: [embed_smith_2] });
  } else if (command === "help") {
    if (!smithmsg.member.permissions.has("ADMINISTRATOR")) return;

    const embed_smith_2 = new MessageEmbed()
      .setFooter(
        `سبني ارتاح يا حج ${smithmsg.author.tag}`,
        smithmsg.author.avatarURL(),
      )
      .setAuthor("Bot By Server Pasin Community.", smithmsg.guild.iconURL())
      .addField(
        "أوامر البوت",
        `\`لإظهار نقاطك الحالية -> \`mypoint\n\`للدوران والحصول على جائزتك ->\` spin\n\`لإضافة نقطة إلى عضو معين ->\` addpoint\n\`لمسح جميع النقاط من الأعضاء -> \`clearpoint\n`,
        true,
      )
      .addField("بنق البوت", `${client.ws.ping}ms`, true)
      .setColor("ORANGE");

    await smithmsg.reply({ embeds: [embed_smith_2] });
  }
});



function getUserData(userId) {
  const dataPath = "./data.json";
  const rawData = fs.readFileSync(dataPath);
  const data = JSON.parse(rawData);
  return data[userId] || { points: 0 };
}


function addPoints(userId, points) {
  const dataPath = "./data.json";
  const rawData = fs.readFileSync(dataPath);
  const data = JSON.parse(rawData);
  data[userId] = { points: (data[userId]?.points || 0) + points };
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function clearAllPoints() {
  const dataPath = "./data.json";
  fs.writeFileSync(dataPath, "{}");
}
  
function getPoints(userId) {
  // قراءة محتويات ملف JSON
  const data = fs.readFileSync('data.json');
  const jsonData = JSON.parse(data);

  // البحث عن العضو باستخدام معرفه
  const user = jsonData[userId];

  if (user) {
    // إرجاع قيمة نقاط العضو إذا كان موجودًا
    return user.points;
  } else {
    // إرجاع قيمة افتراضية إذا لم يتم العثور على العضو
    return 0;
  }
}

function updatePoints(userId, points) {
  // قراءة محتويات ملف JSON
  const data = fs.readFileSync('data.json');
  const jsonData = JSON.parse(data);

  // تحديث نقاط العضو
  if (jsonData[userId]) {
    jsonData[userId].points = points;
  } else {
    jsonData[userId] = { points };
  }

  // حفظ التغييرات في ملف JSON
  fs.writeFileSync('data.json', JSON.stringify(jsonData));
}

client.login(process.env.TOKEN);
