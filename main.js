/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: vsozonof <vsozonof@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/23 21:44:50 by vsozonof          #+#    #+#             */
/*   Updated: 2025/05/29 19:34:22 by vsozonof         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

const fs = require('fs');

// cron job -> automatiser l'envois des messages
const cron = require('node-cron');

// axios -> permets de faire nos requêtes API
const axios = require('axios');

// utils pour utiliser l'api dc et le bot
// -> client: pour pouvoir contrôler le bot
// -> GatewayIntentBits: octroyer des "droits" au bot
const { Client,
		GatewayIntentBits } = require('discord.js');

// droits du client (sur l'api discord)
const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildVoiceStates]});

// pour le .env
// -> pour ne pas avoir de données sensibles dans le code
require('dotenv').config();

// ______________________________
//             JSON
// ______________________________

// load le JSON sur teams
let teams = loadPlayers();

// load le json
function loadPlayers() {
	try {
		return JSON.parse(fs.readFileSync('players.json', 'utf-8'));
	} catch (error) {
		console.error('Error loading players:', error);
		return null;
	}
}

// save les modifs sur le json
function savePlayers() {
	fs.writeFileSync('players.json', JSON.stringify(teams, null, 2), 'utf-8');
}


// ______________________________
//		CALL API RITO GAMES
// ______________________________

// utils pour faire les call API
const RIOT_API_KEY = process.env.API_KEY;
const REGION = 'americas';

// sleep maison pour limiter les call API
// limites API: 20/s - 200/mins
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// return le PUUID du riotID donné en params
async function getPuuid(summonerName, tagLine) {
	console.log(summonerName, tagLine);
		try {
		const response = await axios.get(
			`https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`,
			{
				headers: { "X-Riot-Token": RIOT_API_KEY}
			}
		);

		return response.data.puuid;
	} catch (error) {
		console.log(`Error: `, error.response?.data || error.message);
		console.log(error.response.data);
		return null;
	}
}

async function updatePlayerData() {
	for (const [teamName, players] of Object.entries(teams)) {
		console.log(`Fetching PUUIDs and stats for team: ${teamName}`);

		for (const player of players) {
			try {
				const puuid = player.puuid;
				const response = await axios.get(
					`https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
					{
						headers: { "X-Riot-Token": RIOT_API_KEY }
					}
				);
				const soloQEntry = response.data.find(entry => entry.queueType === "RANKED_SOLO_5x5");

				if (!player.stats)
					player.stats = {};

				if (soloQEntry) {
					player.stats.tier = soloQEntry.tier;
					player.stats.rank = soloQEntry.rank;
					player.stats.lp = soloQEntry.leaguePoints;
					player.stats.wins = soloQEntry.wins;
					player.stats.losses = soloQEntry.losses;
				} else {
					player.stats.tier = "UNRANKED";
					player.stats.rank = "";
					player.stats.wins = 0;
					player.stats.losses = 0;
				}

			savePlayers(); 
			} catch (error) {
				console.error(`Failed to fetch data for player ${player.username}:`, error.message);
			}
			await sleep(500);
		}
	}
}



// connecte le bot
client.login(process.env.DISCORD_TOKEN);

// exec cette partie dès que le bot est "ready" -> en ligne
client.once('ready', async() => {
	console.log(`The bot is online as ${client.user.tag}`);


	savePlayers()


	// await updatePlayerData();
	let listOfAllPlayers = []
	let ListOfAllTeamsPlayers = [];

	for (const [teamName, players] of Object.entries(teams)) {
		for (let i = 0; i < players.length; i++) {
			listOfAllPlayers.push(players[i])
		}
		// Array [0] = TeamGoxyd, Array[1] = TeamDrattix ect... Array [3] = TeamMathias
		ListOfAllTeamsPlayers.push(players)
	}


	// Filtering all of the UNRANKED, then SORTING all of them in Highest elo (index 0), to Lowest
	const sortedListOfAllPlayers = listOfAllPlayers.filter((x) => x.stats && x.stats.tier !== "UNRANKED").sort(sortPlayers);

	//Recupéré l'élo moyen de chaque équipe (la par ex que goxyd donc une for loop pour tout recup ou je peut même intégré direct
	//  dans la fonction de le faire dès qu'on call la fonction average et sa retourne un array of object)
	let AverageEloGoxyd = calculateAverageRank(ListOfAllTeamsPlayers[0]);

	
});


// ______________________________
//         SORT PLAYERS
// ______________________________



function sortPlayers(playerA, playerB) {

	const TIER = {
		"IRON": 0,
		"BRONZE": 1,
		"SILVER": 2,
		"GOLD": 3,
		"PLATINUM": 4,
		"EMERALD": 5,
		"DIAMOND": 6,
		"MASTER": 7,
		"GRANDMASTER": 8,
		"CHALLENGER": 9,
	}
	
	const RANK = {
		"IV": 0,
		"III": 1,
		"II": 2,
		"I": 3,
	}
	

	//Compare TIER
	if (TIER[playerA.stats.tier] < TIER[playerB.stats.tier]) {
		return 1;
	} else if (TIER[playerA.stats.tier] > TIER[playerB.stats.tier]) {
		return -1;
	} else {
		// Compare LP if Master/Grandmaster or Challenger
		if ((playerA.stats.tier === "MASTER" || playerA.stats.tier === "GRANDMASTER" || playerA.stats.tier === "CHALLENGER") 
			&& (playerB.stats.tier === "MASTER" || playerB.stats.tier === "GRANDMASTER" || playerB.stats.tier === "CHALLENGER")) {
			if (playerA.stats.lp < playerB.stats.lp) {
				return 1;
			} else if (playerA.stats.lp > playerB.stats.lp) {
				return -1;
			} else {
				return 0
			}
		}
		// Compare RANK if TIER equal
		if (RANK[playerA.stats.rank] < RANK[playerB.stats.rank]) {
			return 1;
		} else if (RANK[playerA.stats.rank] > RANK[playerB.stats.rank]) {
			return -1;
		} else {
			// Compare LP if TIER equal
			if (playerA.stats.lp < playerB.stats.lp) {
				return 1;
			} else if (playerA.stats.lp > playerB.stats.lp) {
				return -1;
			} else {
				return 0
			}
		}
	}
}

// A function that calculate the average of all the elo contained in an array
function calculateAverageRank(targetArray) {

	let pointsArrayPlayer = [];

    const tierBasePoints = {
        "IRON": 0,
        "BRONZE": 400,  // Iron IV-I = 400 LP
        "SILVER": 800,  // Bronze IV-I = 400 LP
        "GOLD": 1200,   // Silver IV-I = 400 LP
        "PLATINUM": 1600, // Gold IV-I = 400 LP
        "EMERALD": 2000, // Platinum IV-I = 400 LP
        "DIAMOND": 2400,  // Emerald IV-I = 400 LP
        "MASTER": 2800,   // Diamond IV-I = 400 LP
        "GRANDMASTER": 3200, // Assuming Master tier spans ~400-500 LP before GM (this is an approximation)
        "CHALLENGER": 3700   // Assuming GM tier spans ~400-500 LP before Challenger (approximation)
    };

    // Points for each division within a tier (Iron to Diamond)
    const rankDivisionPoints = {
        "IV": 0,
        "III": 100,
        "II": 200,
        "I": 300
    };

	for (let i = 0; i < targetArray.length; i++) {
		// Filtering UNRANKED player just incase
		if (targetArray[i].stats.tier === "UNRANKED") {
			continue;
		}
		// Verif pour Master/GM/Chall
		if (rankDivisionPoints[targetArray[i].stats.rank]) {
			pointsArrayPlayer.push(tierBasePoints[targetArray[i].stats.tier] + rankDivisionPoints[targetArray[i].stats.rank] + targetArray[i].stats.lp);
		} else {
			pointsArrayPlayer.push(tierBasePoints[targetArray[i].stats.tier] + targetArray[i].stats.lp);
		}
	}

	const sumPoint = pointsArrayPlayer.reduce((iterator, currentValue) => iterator + currentValue, 0);
	const pointsAverage = Math.round(sumPoint / pointsArrayPlayer.length);

	return getRankFromPoints(pointsAverage);

	function getRankFromPoints(points) {
		let ELO = {};

		// Keeping the previous rank to get it when found
		let previousTier = "";
		// Looping through tier and removing the point of the tier
		for (let [tierName, tierPointValue] of Object.entries(tierBasePoints)) {
			if (points < tierPointValue) {
				ELO.tier = previousTier;
				points -= tierBasePoints[previousTier];
				break;
			}
			previousTier = tierName;
		}

		let previousRank = "";
		// Looping through rank and removing the point of the rank
		for (let [tierName, tierPointValue] of Object.entries(rankDivisionPoints)) {
			if (points < tierPointValue) {
				ELO.rank = previousRank;
				points -= rankDivisionPoints[previousRank];
				break;
			}
			previousRank = tierName;
		}

		// points restant = LP
		ELO.lp = points;
		return ELO;
	}
}