require("dotenv").config();

const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const profilesPath = "./data/profiles.json";

let profiles = {};

const serverSettingsPath = "./data/serverSettings.json";

let serverSettings = {};

if (fs.existsSync(serverSettingsPath)) {
  serverSettings = JSON.parse(fs.readFileSync(serverSettingsPath, "utf8"));
}

function saveServerSettings() {
  fs.writeFileSync(
    serverSettingsPath,
    JSON.stringify(serverSettings, null, 2)
  );
}

if (fs.existsSync(profilesPath)) {
  profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

function saveProfiles() {
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

function createProfile(userId) {
  if (!profiles[userId]) {
    if (!profile.titles) profile.titles = ["Wanderer"];
    if (!profile.activeTitle) profile.activeTitle = "Wanderer";
    if (!profile.achievements) profile.achievements = [];
    if (!profile.inventory) profile.inventory = [];
    profiles[userId] = {
      renown: 0,
      level: 1,
      gold: 100,
      class: "Novice",
      titles: ["Wanderer"],
      activeTitle: "Wanderer",
      gamesWon: 0,
      questsCompleted: 0,
      lastXp: 0,
      lastDaily: 0,
      dailyStreak: 0,
      lastDailyDate: 0,
      runesSolved: 0,
      dailyMessages: 0,
      dailyRunesSolved: 0,
      dailyQuestClaimed: false,
      questMessages: 0,
      questRunesSolved: 0,
      questDailyClaimed: false,
      questRewardClaimed: false,
      achievements: [],
      inventory: [],
      dungeonsCompleted: 0,
      lastDungeon: 0,
    };

    saveProfiles();
  }
}

function renownNeeded(level) {
  return level * 100;
}

async function checkLevelUp(message, profile) {
  let leveledUp = false;

  while (profile.renown >= renownNeeded(profile.level)) {
    profile.renown -= renownNeeded(profile.level);
    profile.level++;
    profile.gold += 25;
    leveledUp = true;

    const unlockedTitles = checkTitles(profile);

    for (const title of unlockedTitles) {
      const titleEmbed = new EmbedBuilder()
        .setColor("#FBBF24")
        .setTitle("🏆 Title Unlocked!")
        .setDescription(`${message.author} has unlocked the title **${title}**!`)
        .setFooter({ text: "Valoryn • A new legend is written" })
        .setTimestamp();

      await message.channel.send({ embeds: [titleEmbed] });
    }
  }

  if (leveledUp) {
    const levelEmbed = new EmbedBuilder()
      .setColor("#FBBF24")
      .setTitle("🌟 Rank Ascended!")
      .setDescription(
        `${message.author} has risen to **Level ${profile.level}**!\n\nThe guild grants them **25 gold**.`
      )
      .setFooter({ text: "Valoryn • Forge Your Legend" });

   await message.channel.send({ embeds: [levelEmbed] });
  }
}

function applyClassBonus(profile, rewardType, amount) {
  const adventurerClass = profile.class?.toLowerCase();

  if (adventurerClass === "warrior" && rewardType === "dailyGold") {
    return Math.floor(amount * 1.10);
  }

  if (adventurerClass === "mage" && rewardType === "runeRenown") {
    return Math.floor(amount * 1.10);
  }

  if (adventurerClass === "ranger" && rewardType === "chatRenown") {
    return Math.floor(amount * 1.10);
  }

  if (adventurerClass === "rogue" && rewardType === "runeGold") {
    return Math.floor(amount * 1.10);
  }

  return amount;
}


function unlockTitle(profile, title) {
  if (!profile.titles) profile.titles = ["Wanderer"];

  if (!profile.titles.includes(title)) {
    profile.titles.push(title);
    return true;
  }

  return false;
}

function checkTitles(profile) {
  const unlocked = [];

  if (unlockTitle(profile, "Wanderer")) {
    unlocked.push("Wanderer");
  }

  if ((profile.runesSolved || 0) >= 5 && unlockTitle(profile, "Runebreaker")) {
    unlocked.push("Runebreaker");
  }

  if ((profile.runesSolved || 0) >= 25 && unlockTitle(profile, "Rune Master")) {
    unlocked.push("Rune Master");
  }

  if ((profile.level || 1) >= 10 && unlockTitle(profile, "Guild Champion")) {
    unlocked.push("Guild Champion");
  }

  if ((profile.dailyStreak || 0) >= 30 && unlockTitle(profile, "The Dedicated")) {
    unlocked.push("The Dedicated");
  }

  if ((profile.level || 1) >= 25 && unlockTitle(profile, "Hero of Valoryn")) {
    unlocked.push("Hero of Valoryn");
  }

  if (!profile.activeTitle) {
    profile.activeTitle = profile.title || "Wanderer";
  }

  if ((profile.runesSolved || 0) >= 100 && unlockTitle(profile, "Rune Lord")) {
  unlocked.push("Rune Lord");
}

if ((profile.level || 1) >= 50 && unlockTitle(profile, "Legend of Valoryn")) {
  unlocked.push("Legend of Valoryn");
}

if ((profile.dailyStreak || 0) >= 100 && unlockTitle(profile, "The Unbroken")) {
  unlocked.push("The Unbroken");
}

if ((profile.questBoardsCompleted || 0) >= 25 && unlockTitle(profile, "Questbound")) {
  unlocked.push("Questbound");
}

if ((profile.questBoardsCompleted || 0) >= 100 && unlockTitle(profile, "Guild Veteran")) {
  unlocked.push("Guild Veteran");
}


  return unlocked;
}

function unlockAchievement(profile, achievement) {
  if (!profile.achievements) profile.achievements = [];

  if (!profile.achievements.includes(achievement)) {
    profile.achievements.push(achievement);
    return true;
  }

  return false;
}

function checkAchievements(profile) {
  const unlocked = [];

  if ((profile.level || 1) >= 5 && unlockAchievement(profile, "First Steps")) {
    unlocked.push("First Steps");
  }

  if ((profile.runesSolved || 0) >= 5 && unlockAchievement(profile, "Rune Solver")) {
    unlocked.push("Rune Solver");
  }

  if ((profile.level || 1) >= 10 && unlockAchievement(profile, "Veteran Adventurer")) {
    unlocked.push("Veteran Adventurer");
  }

  if ((profile.dailyStreak || 0) >= 7 && unlockAchievement(profile, "Consistent")) {
    unlocked.push("Consistent");
  }

  if ((profile.gold || 0) >= 1000 && unlockAchievement(profile, "Gold Hoarder")) {
    unlocked.push("Gold Hoarder");
  }

  if ((profile.questsCompleted || 0) >= 25 && unlockAchievement(profile, "Guild Hero")) {
    unlocked.push("Guild Hero");
  }

  if ((profile.runesSolved || 0) >= 25 && unlockAchievement(profile, "Rune Master")) {
  unlocked.push("Rune Master");
}

if ((profile.runesSolved || 0) >= 100 && unlockAchievement(profile, "Rune Champion")) {
  unlocked.push("Rune Champion");
}

if ((profile.level || 1) >= 25 && unlockAchievement(profile, "Elite Adventurer")) {
  unlocked.push("Elite Adventurer");
}

if ((profile.dailyStreak || 0) >= 30 && unlockAchievement(profile, "Dedicated")) {
  unlocked.push("Dedicated");
}

if ((profile.gold || 0) >= 5000 && unlockAchievement(profile, "Wealthy")) {
  unlocked.push("Wealthy");
}

if ((profile.questBoardsCompleted || 0) >= 100 && unlockAchievement(profile, "Guild Veteran")) {
  unlocked.push("Guild Veteran");
}

  return unlocked;
}


let activeRuneQuiz = null;

const runeQuizzes = [
  {
    category: "Movies",
    runes: "🦇🌃",
    answer: "batman",
    hint: "A dark knight watches over the city."
  },
  {
    category: "Games",
    runes: "🍄👨🚗",
    answer: "mario kart",
    hint: "A racing game with mushrooms."
  },
  {
    category: "Movies",
    runes: "🧙‍♂️💍🔥",
    answer: "lord of the rings",
    hint: "A fantasy quest to destroy jewelry."
  },
  {
    category: "Sports",
    runes: "🏎️💨🏁",
    answer: "racing",
    hint: "Fast cars and finish lines."
  },
  {
    category: "Movies",
    runes: "🧊👸❄️",
    answer: "frozen",
    hint: "A snowy animated kingdom."
  },
  {
    category: "Movies",
    runes: "🕷️👨🏙️",
    answer: "spiderman",
    hint: "A web-slinging city hero."
  },
  {
    category: "Movies",
    runes: "🧙‍♂️⚡🦉",
    answer: "harry potter",
    hint: "A young wizard with an owl."
  },
  {
    category: "Movies",
    runes: "🦁👑",
    answer: "lion king",
    hint: "A royal animal story."
  },
  {
    category: "Movies",
    runes: "🚢🧊💔",
    answer: "titanic",
    hint: "A ship, an iceberg, and heartbreak."
  },
  {
    category: "Movies",
    runes: "🦖🏝️",
    answer: "jurassic park",
    hint: "Dinosaurs on an island."
  },
  {
    category: "Movies",
    runes: "👽📞🏠",
    answer: "et",
    hint: "A friendly alien wants to phone home."
  },
  {
    category: "Movies",
    runes: "👻🔫",
    answer: "ghostbusters",
    hint: "Who you gonna call?"
  },
  {
    category: "Movies",
    runes: "🐢🥷🍕",
    answer: "teenage mutant ninja turtles",
    hint: "Pizza-loving heroes in a half shell."
  },
  {
    category: "Mythic",
    runes: "🧟‍♂️🧠",
    answer: "zombie",
    hint: "A creature that wants brains."
  },
  {
    category: "Mythic",
    runes: "🐉🔥🏰",
    answer: "dragon",
    hint: "A fire-breathing fantasy beast."
  },
  {
    category: "Fantasy",
    runes: "🧝‍♂️🏹🌲",
    answer: "elf",
    hint: "A forest-dwelling archer from fantasy."
  },
  {
    category: "Fantasy",
    runes: "⚔️🛡️🏰",
    answer: "knight",
    hint: "A warrior of the castle."
  },
  {
    category: "Fantasy",
    runes: "🧙‍♀️🪄✨",
    answer: "wizard",
    hint: "A spellcaster with magic."
  },
  {
    category: "Place",
    runes: "💍🌋",
    answer: "mordor",
    hint: "The ring must be destroyed here."
  },
  {
    category: "Movies",
    runes: "⚡🔨",
    answer: "thor",
    hint: "A thunder god with a hammer."
  },
  {
    category: "Movies",
    runes: "🛡️⭐",
    answer: "captain america",
    hint: "A patriotic hero with a shield."
  },
  {
    category: "Movies",
    runes: "🦸‍♂️🕷️",
    answer: "spiderman",
    hint: "A superhero with spider powers."
  },
  {
    category: "Movies",
    runes: "🟢👹🐴",
    answer: "shrek",
    hint: "An ogre with a donkey friend."
  },
  {
    category: "Movies",
    runes: "🐠🔎",
    answer: "finding nemo",
    hint: "A missing clownfish."
  },
  {
    category: "Movies",
    runes: "🚗🤖",
    answer: "transformers",
    hint: "Robots in disguise."
  },
  {
    category: "Movies",
    runes: "🧸🚀🤠",
    answer: "toy story",
    hint: "Toys that come alive."
  },
  {
    category: "Shows",
    runes: "👑💍🐉",
    answer: "game of thrones",
    hint: "Kings, dragons, and betrayal."
  },
  {
    category: "Shows",
    runes: "🧟‍♂️🚶‍♂️",
    answer: "the walking dead",
    hint: "Survivors in a zombie apocalypse."
  },
  {
    category: "Shows",
    runes: "🏴‍☠️⚓💰",
    answer: "pirates",
    hint: "Sailors who seek treasure."
  },
  {
    runes: "🧛🩸🌙",
    answer: "vampire",
    hint: "A creature of the night."
  }
];

const allTitles = [
  "Wanderer",
  "Runebreaker",
  "Rune Master",
  "Rune Lord",
  "Guild Champion",
  "The Dedicated",
  "Questbound",
  "Guild Veteran",
  "Hero of Valoryn",
  "The Unbroken",
  "Legend of Valoryn"
];


const allAchievements = [
  "First Steps",
  "Rune Solver",
  "Rune Master",
  "Veteran Adventurer",
  "Elite Adventurer",
  "Consistent",
  "Dedicated",
  "Gold Hoarder",
  "Wealthy",
  "Guild Hero",
  "Guild Veteran",
  "Rune Champion"
];


const questLoot = [
  { item: "🪙 Coin Pouch", rarity: "Common" },
  { item: "📜 Ancient Scroll", rarity: "Common" },
  { item: "🧪 Minor Potion", rarity: "Uncommon" },
  { item: "💎 Guild Gem", rarity: "Rare" }
];

const runeLoot = [
  { item: "🔮 Rune Shard", rarity: "Common" },
  { item: "📜 Faded Glyph", rarity: "Common" },
  { item: "💠 Arcane Crystal", rarity: "Uncommon" },
  { item: "🪬 Mystic Charm", rarity: "Rare" }
];

const dungeonLoot = [
  { item: "🦴 Goblin Bone", rarity: "Common" },
  { item: "🗡️ Rusted Dagger", rarity: "Common" },
  { item: "💍 Tarnished Ring", rarity: "Uncommon" },
  { item: "🐉 Dragon Scale", rarity: "Rare" }
];

const itemValues = {
    //questloot
  "🪙 Coin Pouch": 15,
  "📜 Ancient Scroll": 25,
  "🧪 Minor Potion": 20,
  "💎 Guild Gem": 75,
    //runeloot
  "🔮 Rune Shard": 20,
  "📜 Faded Glyph": 25,
  "💠 Arcane Crystal": 60,
  "🪬 Mystic Charm": 120,
    //shopitems
    "🧪 Health Potion": 50,
    "📜 Scroll of Fortune": 125,
    "💎 Rune Crystal": 250,
    "🎟️ Quest Token": 375,
    //dungeonloot
    "🦴 Goblin Bone": 20,
    "🗡️ Rusted Dagger": 35,
    "💍 Tarnished Ring": 90,
    "🐉 Dragon Scale": 200
};

const shopItems = [
  { item: "🧪 Health Potion", price: 100, description: "A basic adventurer potion." },
  { item: "📜 Scroll of Fortune", price: 250, description: "A mysterious scroll for future magic." },
  { item: "💎 Rune Crystal", price: 500, description: "A valuable crystal pulsing with arcane power." },
  { item: "🎟️ Quest Token", price: 750, description: "A token of favor from the guild." }
];



const commands = [
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your adventurer profile"),

    new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("View the Hall of Heroes"),
  
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Complete your daily quest for rewards"),

   new SlashCommandBuilder()
  .setName("runequiz")
  .setDescription("Begin a rune puzzle for the guild"), 

  new SlashCommandBuilder()
  .setName("class")
  .setDescription("Set your adventurer class")
  .addStringOption(option =>
    option
      .setName("class")
      .setDescription("Choose your class")
      .setRequired(true)
      .addChoices(
        { name: "⚔️ Warrior", value: "Warrior" },
        { name: "🔮 Mage", value: "Mage" },
        { name: "🏹 Ranger", value: "Ranger" },
        { name: "🗡️ Rogue", value: "Rogue" }
      )
    ),

    new SlashCommandBuilder()
    .setName("questboard")
    .setDescription("View the current quests available to the guild"),  

    new SlashCommandBuilder()
    .setName("runeleaderboard")
    .setDescription("View the top rune solvers in the guild"),

    new SlashCommandBuilder()
  .setName("title")
  .setDescription("Set your active title")
  .addStringOption(option =>
    option
      .setName("title")
      .setDescription("Choose your unlocked title")
      .setRequired(true)
      .addChoices(
        { name: "📜 Wanderer", value: "Wanderer" },
        { name: "📜 Runebreaker", value: "Runebreaker" },
        { name: "📜 Rune Master", value: "Rune Master" },
        { name: "📜 Rune Lord", value: "Rune Lord" },
        { name: "📜 Guild Champion", value: "Guild Champion" },
        { name: "📜 Hero of Valoryn", value: "Hero of Valoryn" },
        { name: "📜 Legend of Valoryn", value: "Legend of Valoryn" },
        { name: "📜 The Dedicated", value: "The Dedicated" },
        { name: "📜 The Unbroken", value: "The Unbroken" },
        { name: "📜 Questbound", value: "Questbound" },
        { name: "📜 Guild Veteran", value: "Guild Veteran" }
        )
  ),

  new SlashCommandBuilder()
  .setName("titles")
  .setDescription("View your title collection"),

  new SlashCommandBuilder()
    .setName("claimquest")
    .setDescription("Claim your completed guild quest board reward"),

    new SlashCommandBuilder()
  .setName("achievements")
  .setDescription("View your achievement collection"),

  new SlashCommandBuilder()
  .setName("inventory")
  .setDescription("View your satchel"),

  new SlashCommandBuilder()
  .setName("sell")
  .setDescription("Sell an item from your satchel")
  .addStringOption(option =>
    option
      .setName("item")
      .setDescription("The item to sell")
      .setRequired(true)
      .addChoices(
                //questloot selling
        { name: "🪙 Coin Pouch", value: "🪙 Coin Pouch" },
        { name: "📜 Ancient Scroll", value: "📜 Ancient Scroll" },
        { name: "🧪 Minor Potion", value: "🧪 Minor Potion" },
        { name: "💎 Guild Gem", value: "💎 Guild Gem" },
                //runeloot selling
        { name: "🔮 Rune Shard", value: "🔮 Rune Shard" },
        { name: "📜 Faded Glyph", value: "📜 Faded Glyph" },
        { name: "💠 Arcane Crystal", value: "💠 Arcane Crystal" },
        { name: "🪬 Mystic Charm", value: "🪬 Mystic Charm" }
            )
  ),
  new SlashCommandBuilder()
  .setName("shop")
  .setDescription("Visit the Guild Merchant"),

  new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Buy an item from the Guild Merchant")
  .addStringOption(option =>
    option
      .setName("item")
      .setDescription("Choose an item to buy")
      .setRequired(true)
      .addChoices(
        { name: "🧪 Health Potion - 100 Gold", value: "🧪 Health Potion" },
        { name: "📜 Scroll of Fortune - 250 Gold", value: "📜 Scroll of Fortune" },
        { name: "💎 Rune Crystal - 500 Gold", value: "💎 Rune Crystal" },
        { name: "🎟️ Quest Token - 750 Gold", value: "🎟️ Quest Token" }
      )
  ),

 new SlashCommandBuilder()
  .setName("use")
  .setDescription("Use an item from your satchel")
  .addStringOption(option =>
    option
      .setName("item")
      .setDescription("Choose an item to use")
      .setRequired(true)
      .addChoices(
        { name: "🧪 Health Potion", value: "🧪 Health Potion" },
        { name: "📜 Scroll of Fortune", value: "📜 Scroll of Fortune" },
        { name: "💎 Rune Crystal", value: "💎 Rune Crystal" },
        { name: "🎟️ Quest Token", value: "🎟️ Quest Token" }
      )
  ),

  new SlashCommandBuilder()
    .setName("dungeon")
    .setDescription("Enter a dungeon for rewards"),

  new SlashCommandBuilder()
  .setName("help")
  .setDescription("View Valoryn commands"),

  new SlashCommandBuilder()
  .setName("setrunequizchannel")
  .setDescription("Set the Rune Quiz channel")
  .addChannelOption(option =>
    option
      .setName("channel")
      .setDescription("Channel for Rune Quizzes")
      .setRequired(true)
  )



].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("clientReady", async readyClient => {
  console.log(`Valoryn is online as ${readyClient.user.tag}`);

  try {
    await rest.put(
  Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    process.env.GUILD_ID
  ),
  { body: commands }
);

    console.log("Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  createProfile(message.author.id);

  const profile = profiles[message.author.id];
  const now = Date.now();

  // Rune quiz answer check
  if (
    activeRuneQuiz &&
    message.channel.id === activeRuneQuiz.channelId &&
    message.content.toLowerCase() === activeRuneQuiz.answer
  ) {
    if(!profile.gamesWon) profile.gamesWon = 0;
    if (!profile.runesSolved) profile.runesSolved = 0;
    profile.gamesWon +=1;
    profile.runesSolved += 1;
    profile.questRunesSolved = (profile.questRunesSolved || 0) + 1;
    const loot = runeLoot[Math.floor(Math.random() * runeLoot.length)];

    if (!profile.inventory) profile.inventory = [];

    profile.inventory.push(loot.item);  


    const unlockedTitles = checkTitles(profile);


    const unlockedAchievements = checkAchievements(profile);

    for (const achievement of unlockedAchievements) {
    const achievementEmbed = new EmbedBuilder()
        .setColor("#FBBF24")
        .setTitle("🏆 Achievement Unlocked!")
        .setDescription(`${interaction.user} unlocked **${achievement}**!`)
        .setFooter({ text: "Valoryn • Glory is earned" })
        .setTimestamp();

    await interaction.channel.send({ embeds: [achievementEmbed] });
    }

    for (const title of unlockedTitles) {
    const titleEmbed = new EmbedBuilder()
        .setColor("#FBBF24")
        .setTitle("🏆 Title Unlocked!")
        .setDescription(`${message.author} has unlocked the title **${title}**!`)
        .setFooter({ text: "Valoryn • A new legend is written" })
        .setTimestamp();

    await message.channel.send({ embeds: [titleEmbed] });
    }
    saveProfiles();
    
    let runeRenownReward = 25;
    let runeGoldReward = 10;

    runeRenownReward = applyClassBonus(profile, "runeRenown", runeRenownReward);
    runeGoldReward = applyClassBonus(profile, "runeGold", runeGoldReward);

    profile.renown += runeRenownReward;
    profile.gold += runeGoldReward;
    profile.gamesWon += 1;

    await checkLevelUp(message, profile);
    saveProfiles();

    const winEmbed = new EmbedBuilder()
      .setColor("#FBBF24")
      .setTitle("⚔️ Rune Puzzle Solved!")
      .setDescription(
        `${message.author} deciphered the runes!\n\n` +
        `Answer: **${activeRuneQuiz.answer}**\n\n` +
        `Rewards:\n✨ **+${runeRenownReward} Renown**\n🪙 **+${runeGoldReward} Gold**\n\n` +
        `🎒 Loot Found:\n${loot.item}\n⭐ ${loot.rarity}`
        )
      .setFooter({ text: "Valoryn • Another legend is written" })
      .setTimestamp();

    activeRuneQuiz = null;

    return message.channel.send({ embeds: [winEmbed] });
  }

// Chat XP cooldown
if (!profile.lastXp) profile.lastXp = 0;
if (now - profile.lastXp < 60000) return;

let renownReward = Math.floor(Math.random() * 11) + 5;
renownReward = applyClassBonus(profile, "chatRenown", renownReward); 
const goldReward = Math.floor(Math.random() * 6) + 1;    // 1-6
profile.questMessages = (profile.questMessages || 0) + 1;

profile.renown += renownReward;
profile.gold += goldReward;
profile.lastXp = now;

await checkLevelUp(message, profile);
saveProfiles();
});

client.on("interactionCreate", async interaction => {
 
  if (interaction.isButton()) {
  if (interaction.customId === "rune_hint") {
    if (!activeRuneQuiz) {
      return interaction.reply({
        content: "There is no active rune puzzle.",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `💡 Hint: ${activeRuneQuiz.hint}`,
      ephemeral: true
    });
  }

  if (interaction.customId === "rune_first_letter") {
    if (!activeRuneQuiz) {
      return interaction.reply({
        content: "There is no active rune puzzle.",
        ephemeral: true
      });
    }

    const firstLetter = activeRuneQuiz.answer.charAt(0).toUpperCase();

    return interaction.reply({
      content: `🔤 First Letter: **${firstLetter}**`,
      ephemeral: true
    });

  }
    if (interaction.customId === "rune_skip") {
    if (!activeRuneQuiz) {
        return interaction.reply({
        content: "There is no active rune puzzle.",
        ephemeral: true
        });
    }

    const answer = activeRuneQuiz.answer;

    activeRuneQuiz = null;

    const skipEmbed = new EmbedBuilder()
        .setColor("#B91C1C")
        .setTitle("⏭️ Rune Puzzle Skipped")
        .setDescription(
        `The Guild Archivists have abandoned this puzzle.\n\n` +
        `The answer was: **${answer}**`
        )
        .setFooter({ text: "Valoryn • Another mystery awaits" })
        .setTimestamp();

    return interaction.reply({ embeds: [skipEmbed] });
    }

    if (interaction.customId === "rune_stats") {
    const statsEmbed = new EmbedBuilder()
        .setColor("#6D28D9")
        .setTitle("📊 Rune Puzzle Stats")
        .setDescription(
        `Total Puzzles Solved: **${Object.values(profiles).reduce((sum, p) => sum + profiles.runesSolved, 0)}**\n` +
        `Current Puzzle: ${activeRuneQuiz ? "Active" : "None"}`
        )
        .setFooter({ text: "Valoryn • The guild's pulse" })
        .setTimestamp();

    return interaction.reply({ embeds: [statsEmbed] });
    }
}

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "profile") {
    createProfile(interaction.user.id);

    const profile = profiles[interaction.user.id];
    const needed = renownNeeded(profile.level);
    if (!profile.achievements) profile.achievements = [];

    const profileEmbed = new EmbedBuilder()
      .setColor("#6D28D9")
      .setTitle("⚔️ Adventurer Profile")
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`${interaction.user} stands before the guild.`)
      .addFields(
        { name: "🏅 Level", value: profile.level.toString(), inline: true },
        { name: "✨ Renown", value: `${profile.renown} / ${needed}`, inline: true },
        { name: "🪙 Gold", value: profile.gold.toString(), inline: true },
        { name: "🛡️ Class", value: profile.class, inline: true },
        {
  name: "📜 Title",
  value: profile.activeTitle || profile.title || "Wanderer",
  inline: true
},
        { name: "🏆 Games Won", value: profile.gamesWon.toString(), inline: true }
      )
      .setFooter({ text: "Valoryn • Forge Your Legend" })
      .setTimestamp();

    await interaction.reply({ embeds: [profileEmbed] });
  }


  if (interaction.commandName === "leaderboard") {
  const sortedProfiles = Object.entries(profiles)
    .sort(([, a], [, b]) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.renown - a.renown;
    })
    .slice(0, 10);

  if (sortedProfiles.length === 0) {
    return interaction.reply("No heroes have entered the guild yet.");
  }

  const leaderboardText = sortedProfiles
    .map(([userId, profile], index) => {
      const medals = ["🥇", "🥈", "🥉"];
      const place = medals[index] || `#${index + 1}`;

      return `${place} <@${userId}> — Level **${profile.level}** | ✨ ${profile.renown} Renown`;
    })
    .join("\n");

  const leaderboardEmbed = new EmbedBuilder()
    .setColor("#FBBF24")
    .setTitle("🏆 Hall of Heroes")
    .setDescription(leaderboardText)
    .setFooter({ text: "Valoryn • Legends are forged here" })
    .setTimestamp();

  await interaction.reply({ embeds: [leaderboardEmbed] });
}

if (interaction.commandName === "daily") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (!profile.lastDaily) profile.lastDaily = 0;
  if (!profile.dailyStreak) profile.dailyStreak = 0;
  if (!profile.questsCompleted) profile.questsCompleted = 0;

  const timeLeft = cooldown - (now - profile.lastDaily);

  if (timeLeft > 0) {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    const cooldownEmbed = new EmbedBuilder()
      .setColor("#B91C1C")
      .setTitle("⏳ Quest Already Completed")
      .setDescription(
        `You have already completed today's quest.\n\nReturn in **${hours}h ${minutes}m**.`
      )
      .setFooter({ text: "Valoryn • Patience, adventurer" });

    return interaction.reply({
      embeds: [cooldownEmbed],
      ephemeral: true
    });
  }

  
const twoDays = 48 * 60 * 60 * 1000;

const timeSinceLastDaily = now - profile.lastDaily;

if (timeSinceLastDaily <= twoDays) {
  profile.dailyStreak = (profile.dailyStreak || 0) + 1;
} else {
  profile.dailyStreak = 1;
}

const streakBonus = Math.min(profile.dailyStreak * 10, 200);

const renownReward = 100 + streakBonus;
let goldReward = 50 + Math.floor(streakBonus / 2);
goldReward = applyClassBonus(profile, "dailyGold", goldReward);

profile.renown += renownReward;
profile.gold += goldReward;
profile.questsCompleted += 1;
profile.lastDaily = now;
profile.questDailyClaimed = true;

await checkLevelUp(interaction, profile);

const unlockedAchievements = checkAchievements(profile);

for (const achievement of unlockedAchievements) {
  const achievementEmbed = new EmbedBuilder()
    .setColor("#FBBF24")
    .setTitle("🏆 Achievement Unlocked!")
    .setDescription(`${interaction.user} unlocked **${achievement}**!`)
    .setFooter({ text: "Valoryn • Glory is earned" })
    .setTimestamp();

  await interaction.channel.send({ embeds: [achievementEmbed] });
}

const unlockedTitles = checkTitles(profile);

for (const title of unlockedTitles) {
  const titleEmbed = new EmbedBuilder()
    .setColor("#FBBF24")
    .setTitle("🏆 Title Unlocked!")
    .setDescription(`${interaction.user} has unlocked the title **${title}**!`)
    .setFooter({ text: "Valoryn • A new legend is written" })
    .setTimestamp();

  await interaction.channel.send({ embeds: [titleEmbed] });
}

saveProfiles();

  const dailyEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📜 Daily Quest Complete")
    .setDescription(`${interaction.user} has completed today's guild quest.`)
    .addFields(
  { name: "✨ Renown Earned", value: `+${renownReward}`, inline: true },
  { name: "🪙 Gold Earned", value: `+${goldReward}`, inline: true },
  { name: "🔥 Daily Streak", value: `${profile.dailyStreak} day(s)`, inline: true },
  { name: "📜 Quests Completed", value: profile.questsCompleted.toString(), inline: true }
)
    .setFooter({ text: "Valoryn • The Guild rewards dedication" })
    .setTimestamp();

  await interaction.reply({ embeds: [dailyEmbed] });
}

if (interaction.commandName === "runequiz") {
  if (activeRuneQuiz) {
    return interaction.reply({
      content: "A rune puzzle is already active in the guild hall.",
      ephemeral: true
    });
  }

  const quiz = runeQuizzes[Math.floor(Math.random() * runeQuizzes.length)];

 activeRuneQuiz = {
  channelId: interaction.channel.id,
  answer: quiz.answer.toLowerCase(),
  hint: quiz.hint,
  startedBy: interaction.user.id
};

  const quizEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📜 Rune Puzzle")
    .setDescription(
      `The Guild Archivists have uncovered an ancient rune sequence.\n\n` +
      `# ${quiz.runes}\n\n` +
      `First adventurer to decipher it wins:\n` +
      `✨ **+25 Renown**\n` +
      `🪙 **+10 Gold**`
    )
    .setFooter({ text: "Valoryn • Decipher the runes" })
    .setTimestamp();

    const hintButton = new ButtonBuilder()
  .setCustomId("rune_hint")
  .setLabel("Reveal Hint")
  .setEmoji("💡")
  .setStyle(ButtonStyle.Secondary);

  const firstLetterButton = new ButtonBuilder()
  .setCustomId("rune_first_letter")
  .setLabel("Reveal First Letter")
  .setEmoji("🔤")
  .setStyle(ButtonStyle.Secondary);

  const skipButton = new ButtonBuilder()
  .setCustomId("rune_skip")
  .setLabel("Skip Puzzle")
  .setEmoji("⏭️")
  .setStyle(ButtonStyle.Danger);

  const runeStats = new ButtonBuilder()
  .setCustomId("rune_stats")
  .setLabel("Rune Stats")
  .setEmoji("📊")
  .setStyle(ButtonStyle.Success);

const row = new ActionRowBuilder().addComponents(hintButton, firstLetterButton, skipButton, runeStats);

  await interaction.reply({
  embeds: [quizEmbed],
  components: [row]
});
}

if (interaction.commandName === "class") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];
  const selectedClass = interaction.options.getString("class");

  profile.class = selectedClass;

  saveProfiles();

  const classEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("⚔️ Class Chosen")
    .setDescription(
      `${interaction.user} has chosen the **${selectedClass}** path.`
    )
    .setFooter({
      text: "Valoryn • Your destiny is forged"
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [classEmbed]
  });
}

if (interaction.commandName === "questboard") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];

  if (!profile.questMessages) profile.questMessages = 0;
  if (!profile.questRunesSolved) profile.questRunesSolved = 0;
  if (!profile.questDailyClaimed) profile.questDailyClaimed = false;
  if (!profile.questRewardClaimed) profile.questRewardClaimed = false;

  const messagesDone = profile.questMessages >= 10;
  const runesDone = profile.questRunesSolved >= 1;
  const dailyDone = profile.questDailyClaimed;

  const allDone = messagesDone && runesDone && dailyDone;

  const questEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📜 Guild Quest Board")
    .setDescription("Complete all guild tasks to claim your reward.")
    .addFields(
      {
        name: `${messagesDone ? "✅" : "⬜"} Tavern Talk`,
        value: `Send 10 messages. (${Math.min(profile.questMessages, 10)}/10)`,
        inline: false
      },
      {
        name: `${runesDone ? "✅" : "⬜"} Rune Trial`,
        value: `Solve 1 rune puzzle. (${Math.min(profile.questRunesSolved, 1)}/1)`,
        inline: false
      },
      {
        name: `${dailyDone ? "✅" : "⬜"} Daily Duty`,
        value: `Claim your daily quest. (${dailyDone ? "1" : "0"}/1)`,
        inline: false
      },
      {
        name: "🎁 Completion Reward",
        value: allDone
          ? profile.questRewardClaimed
            ? "Already claimed."
            : "Ready to claim with `/claimquest`!"
          : "✨ 100 Renown\n🪙 50 Gold",
        inline: false
      }
    )
    .setFooter({ text: "Valoryn • The Guild rewards true adventurers" })
    .setTimestamp();

  await interaction.reply({ embeds: [questEmbed] });
}

if (interaction.commandName === "runeleaderboard") {
  const sortedRuneProfiles = Object.entries(profiles)
    .filter(([, profile]) => (profile.runesSolved || 0) > 0)
    .sort(([, a], [, b]) => (b.runesSolved || 0) - (a.runesSolved || 0))
    .slice(0, 10);

  if (sortedRuneProfiles.length === 0) {
    return interaction.reply({
      content: "No adventurers have solved any runes yet.",
      ephemeral: true
    });
  }

  const leaderboardText = sortedRuneProfiles
    .map(([userId, profile], index) => {
      const medals = ["🥇", "🥈", "🥉"];
      const place = medals[index] || `#${index + 1}`;

      return `${place} <@${userId}> — 📜 **${profile.runesSolved || 0}** runes solved`;
    })
    .join("\n");

  const runeLeaderboardEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📜 Rune Masters")
    .setDescription(leaderboardText)
    .setFooter({ text: "Valoryn • Masters of the ancient script" })
    .setTimestamp();

  await interaction.reply({ embeds: [runeLeaderboardEmbed] });
}

if (interaction.commandName === "title") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];

  if (!profile.titles) profile.titles = ["Wanderer"];
  if (!profile.activeTitle) profile.activeTitle = profile.title || "Wanderer";

  const selectedTitle = interaction.options.getString("title");

  if (!profile.titles.includes(selectedTitle)) {
    return interaction.reply({
      content: `You have not unlocked **${selectedTitle}** yet.`,
      ephemeral: true
    });
  }

  profile.activeTitle = selectedTitle;
  profile.title = selectedTitle;

  saveProfiles();

  const titleEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📜 Title Equipped")
    .setDescription(`${interaction.user} is now known as **${selectedTitle}**.`)
    .setFooter({ text: "Valoryn • Legends choose their names" })
    .setTimestamp();

  await interaction.reply({ embeds: [titleEmbed] });
}

if (interaction.commandName === "titles") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];

  if (!profile.titles) profile.titles = ["Wanderer"];
  if (!profile.activeTitle) profile.activeTitle = profile.title || "Wanderer";


  const titleList = allTitles
    .map(title => {
      const owned = profile.titles.includes(title);
      const active = profile.activeTitle === title;

      if (active) return `🌟 **${title}** — Equipped`;
      if (owned) return `✅ ${title}`;
      return `🔒 ${title}`;
    })
    .join("\n");

  const titlesEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📜 Title Collection")
    .setDescription(titleList)
    .setFooter({ text: "Valoryn • Titles mark your legend" })
    .setTimestamp();

  await interaction.reply({
    embeds: [titlesEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "claimquest") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];

  const messagesDone = (profile.questMessages || 0) >= 10;
  const runesDone = (profile.questRunesSolved || 0) >= 1;
  const dailyDone = profile.questDailyClaimed || false;

  if (profile.questRewardClaimed) {
    return interaction.reply({
      content: "You have already claimed today’s guild quest reward.",
      ephemeral: true
    });
  }

  if (!messagesDone || !runesDone || !dailyDone) {
    return interaction.reply({
      content: "You have not completed all guild quests yet.",
      ephemeral: true
    });
  }

  const loot = questLoot[Math.floor(Math.random() * questLoot.length)];

  if (!profile.inventory) profile.inventory = [];

  profile.renown += 100;
  profile.gold += 50;
  profile.questRewardClaimed = true;
  profile.questBoardsCompleted = (profile.questBoardsCompleted || 0) + 1;
  profile.inventory.push(loot.item);

  const unlockedTitles = checkTitles(profile);
  const unlockedAchievements = checkAchievements(profile);

  await checkLevelUp(interaction, profile);
  saveProfiles();

  const claimEmbed = new EmbedBuilder()
    .setColor("#FBBF24")
    .setTitle("🎁 Guild Quest Reward Claimed")
    .setDescription(`${interaction.user} has completed the guild board!`)
    .addFields(
      { name: "✨ Renown", value: "+100", inline: true },
      { name: "🪙 Gold", value: "+50", inline: true },
      { name: "🎒 Loot", value: `${loot.item}\n⭐ ${loot.rarity}`, inline: false }
    )
    .setFooter({ text: "Valoryn • The Guild honors your deeds" })
    .setTimestamp();

  await interaction.reply({ embeds: [claimEmbed] });
}

if (interaction.commandName === "achievements") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];
  if (!profile.achievements) profile.achievements = [];

  const achievementList = allAchievements
    .map(achievement => {
      const owned = profile.achievements.includes(achievement);
      return `${owned ? "✅" : "🔒"} ${achievement}`;
    })
    .join("\n") || "No achievements yet.";

  const achievementEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("🏆 Achievement Collection")
    .setDescription(achievementList)
    .setFooter({ text: "Valoryn • Your deeds are remembered" })
    .setTimestamp();

  await interaction.reply({
    embeds: [achievementEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "inventory") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];

  if (!profile.inventory) profile.inventory = [];

  const itemCounts = {};

for (const item of profile.inventory) {
  itemCounts[item] = (itemCounts[item] || 0) + 1;
}

const inventoryText = Object.keys(itemCounts).length > 0
  ? Object.entries(itemCounts)
      .map(([item, count]) => `${item} x${count}`)
      .join("\n")
  : "Your satchel is empty.";

  const inventoryEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("🎒 Adventurer Satchel")
    .setDescription(inventoryText)
    .setFooter({ text: "Valoryn • Every legend carries relics" })
    .setTimestamp();

  await interaction.reply({
    embeds: [inventoryEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "sell") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];
  if (!profile.inventory) profile.inventory = [];

  const itemToSell = interaction.options.getString("item");

  if (!profile.inventory.includes(itemToSell)) {
    return interaction.reply({
      content: `You do not have **${itemToSell}** in your satchel.`,
      ephemeral: true
    });
  }

  const sellValue = itemValues[itemToSell] || 0;

  const itemIndex = profile.inventory.indexOf(itemToSell);
  profile.inventory.splice(itemIndex, 1);

  profile.gold += sellValue;

  saveProfiles();

  const sellEmbed = new EmbedBuilder()
    .setColor("#FBBF24")
    .setTitle("🪙 Item Sold")
    .setDescription(`${interaction.user} sold **${itemToSell}**.`)
    .addFields(
      { name: "Gold Earned", value: `+${sellValue}`, inline: true },
      { name: "Current Gold", value: profile.gold.toString(), inline: true }
    )
    .setFooter({ text: "Valoryn • The merchant accepts your wares" })
    .setTimestamp();

  await interaction.reply({
    embeds: [sellEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "shop") {
  const shopText = shopItems
    .map(item =>
      `${item.item}\n🪙 **${item.price} Gold**\n${item.description}`
    )
    .join("\n\n");

  const shopEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("🛒 Guild Merchant")
    .setDescription("The merchant lays out their wares before you.\n\n" + shopText)
    .setFooter({ text: "Valoryn • Spend your gold wisely" })
    .setTimestamp();

  await interaction.reply({
    embeds: [shopEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "buy") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];
  if (!profile.inventory) profile.inventory = [];

  const itemName = interaction.options.getString("item");

  const shopItem = shopItems.find(item => item.item === itemName);

  if (!shopItem) {
    return interaction.reply({
      content: "That item is not sold by the Guild Merchant.",
      ephemeral: true
    });
  }

  if (profile.gold < shopItem.price) {
    return interaction.reply({
      content: `You need **${shopItem.price} gold**, but you only have **${profile.gold} gold**.`,
      ephemeral: true
    });
  }

  profile.gold -= shopItem.price;
  profile.inventory.push(shopItem.item);

  saveProfiles();

  const buyEmbed = new EmbedBuilder()
    .setColor("#FBBF24")
    .setTitle("🛒 Purchase Complete")
    .setDescription(`${interaction.user} purchased **${shopItem.item}**.`)
    .addFields(
      { name: "🪙 Cost", value: `${shopItem.price}`, inline: true },
      { name: "💰 Remaining Gold", value: profile.gold.toString(), inline: true }
    )
    .setFooter({ text: "Valoryn • The merchant thanks you" })
    .setTimestamp();

  await interaction.reply({
    embeds: [buyEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "use") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];
  if (!profile.inventory) profile.inventory = [];

  const itemToUse = interaction.options.getString("item");

  if (!profile.inventory.includes(itemToUse)) {
    return interaction.reply({
      content: `You do not have **${itemToUse}** in your satchel.`,
      ephemeral: true
    });
  }

  const itemIndex = profile.inventory.indexOf(itemToUse);
  profile.inventory.splice(itemIndex, 1);

  let resultText = "";

  if (itemToUse === "🧪 Health Potion") {
    profile.renown += 50;
    resultText = "You drink the potion and feel renewed.\n✨ **+50 Renown**";
  }

  if (itemToUse === "📜 Scroll of Fortune") {
    const goldReward = Math.floor(Math.random() * 101) + 50;
    profile.gold += goldReward;
    resultText = `The scroll reveals hidden fortune.\n🪙 **+${goldReward} Gold**`;
  }

  if (itemToUse === "💎 Rune Crystal") {
    profile.renown += 150;
    resultText = "The crystal pulses with arcane power.\n✨ **+150 Renown**";
  }

  if (itemToUse === "🎟️ Quest Token") {
    profile.questMessages = 10;
    profile.questRunesSolved = 1;
    profile.questDailyClaimed = true;
    resultText = "The guild accepts your token of favor.\n📜 **Quest Board progress completed.**";
  }

  await checkLevelUp(interaction, profile);

  const unlockedTitles = checkTitles(profile);
  const unlockedAchievements = checkAchievements(profile);

  saveProfiles();

  const useEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("🎒 Item Used")
    .setDescription(`${interaction.user} used **${itemToUse}**.\n\n${resultText}`)
    .setFooter({ text: "Valoryn • Relics carry power" })
    .setTimestamp();

  await interaction.reply({
    embeds: [useEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "dungeon") {
  createProfile(interaction.user.id);

  const profile = profiles[interaction.user.id];

  if (!profile.inventory) profile.inventory = [];
  if (!profile.dungeonsCompleted) profile.dungeonsCompleted = 0;
  if (!profile.lastDungeon) profile.lastDungeon = 0;

  const now = Date.now();
  const cooldown = 10 * 60 * 1000;

  if (now - profile.lastDungeon < cooldown) {
    const timeLeft = cooldown - (now - profile.lastDungeon);
    const minutes = Math.ceil(timeLeft / (1000 * 60));

    return interaction.reply({
      content: `You must rest before entering another dungeon. Return in **${minutes} minute(s)**.`,
      ephemeral: true
    });
  }

  profile.lastDungeon = now;

  let successChance = 0.75;

  if ((profile.class || "").toLowerCase() === "warrior") {
    successChance += 0.10;
  }

  const success = Math.random() < successChance;

  if (!success) {
    saveProfiles();

    const failEmbed = new EmbedBuilder()
      .setColor("#B91C1C")
      .setTitle("🏰 Dungeon Failed")
      .setDescription(`${interaction.user} entered the **Goblin Cave** but was forced to retreat.`)
      .setFooter({ text: "Valoryn • Rest, recover, return stronger" })
      .setTimestamp();

    return interaction.reply({ embeds: [failEmbed] });
  }

  let renownReward = Math.floor(Math.random() * 51) + 50;
  let goldReward = Math.floor(Math.random() * 51) + 25;

  if ((profile.class || "").toLowerCase() === "mage") {
    renownReward = Math.floor(renownReward * 1.1);
  }

  if ((profile.class || "").toLowerCase() === "rogue") {
    goldReward = Math.floor(goldReward * 1.1);
  }

  const loot = dungeonLoot[Math.floor(Math.random() * dungeonLoot.length)];

  profile.renown += renownReward;
  profile.gold += goldReward;
  profile.inventory.push(loot.item);
  profile.dungeonsCompleted += 1;

  await checkLevelUp(interaction, profile);

  const unlockedTitles = checkTitles(profile);
  const unlockedAchievements = checkAchievements(profile);

  saveProfiles();

  const dungeonEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("🏰 Dungeon Cleared!")
    .setDescription(`${interaction.user} conquered the **Goblin Cave**.`)
    .addFields(
      { name: "✨ Renown", value: `+${renownReward}`, inline: true },
      { name: "🪙 Gold", value: `+${goldReward}`, inline: true },
      { name: "🎒 Loot", value: `${loot.item}\n⭐ ${loot.rarity}`, inline: false },
      { name: "🏰 Dungeons Cleared", value: profile.dungeonsCompleted.toString(), inline: true }
    )
    .setFooter({ text: "Valoryn • The depths remember your name" })
    .setTimestamp();

  await interaction.reply({ embeds: [dungeonEmbed] });
}

if (interaction.commandName === "help") {
  const helpEmbed = new EmbedBuilder()
    .setColor("#6D28D9")
    .setTitle("📖 Valoryn Help")
    .setDescription("Welcome to the Guild Hall. Here are Valoryn’s commands.")
    .addFields(
      {
        name: "⚔️ Progression",
        value: "`/profile`\n`/leaderboard`\n`/class`\n`/titles`\n`/title`\n`/achievements`",
        inline: false
      },
      {
        name: "📜 Quests",
        value: "`/daily`\n`/questboard`\n`/claimquest`",
        inline: false
      },
      {
        name: "🔮 Rune Puzzles",
        value: "`/runequiz`\n`/runeleaderboard`",
        inline: false
      },
      {
        name: "🎒 Inventory & Economy",
        value: "`/inventory`\n`/shop`\n`/buy`\n`/sell`\n`/use`",
        inline: false
      },
      {
        name: "🏰 Adventure",
        value: "`/dungeon`",
        inline: false
      }
    )
    .setFooter({ text: "Valoryn • Forge Your Legend" })
    .setTimestamp();

  await interaction.reply({
    embeds: [helpEmbed],
    ephemeral: true
  });
}

if (interaction.commandName === "setrunequizchannel") {

  if (!interaction.memberPermissions.has("Administrator")) {
    return interaction.reply({
      content: "Only administrators may configure the guild.",
      ephemeral: true
    });
  }

  const guildId = interaction.guild.id;

  if (!serverSettings[guildId]) {
    serverSettings[guildId] = {};
  }

  // 👇 This is where those lines go
  const channel = interaction.options.getChannel("channel");

serverSettings[guildId].runeQuizChannel = channel.id;
saveServerSettings();

await interaction.reply({
  content: `🔮 Rune Quiz channel set to ${channel}.`,
  ephemeral: true
});

}


});

client.login(process.env.DISCORD_TOKEN);