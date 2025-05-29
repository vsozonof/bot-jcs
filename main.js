/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: vsozonof <vsozonof@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/23 21:44:50 by vsozonof          #+#    #+#             */
/*   Updated: 2025/05/29 18:29:03 by vsozonof         ###   ########.fr       */
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
		return {};
	}
}

// save les modifs sur le json
function savePlayers()
{
	fs.writeFileSync('players.json', JSON.stringify(teams, null, 2), 'utf-8');
}


// ______________________________
//		CALL API RITO GAMES
// ______________________________

// utils pour faire les call API
const RIOT_API_KEY = process.env.API_KEY;
const REGION = 'europe';

// sleep maison pour limiter les call API
// limites API: 20/s - 200/mins
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// return le PUUID du riotID donné en params
async function getPuuid(summonerName, tagLine) {
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
		return null;
	}
}

async function updatePlayerData() {
	try {

		const response = await axios.get(
						`https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`,
			{
				headers: { "X-Riot-Token": RIOT_API_KEY}
			}	
		);
	}
}


// connecte le bot
client.login(process.env.DISCORD_TOKEN);

// exec cette partie dès que le bot est "ready" -> en ligne
client.once('ready', async() => {
	console.log(`The bot is online as ${client.user.tag}`);

	for (const [teamName, players] of Object.entries(teams)) {
		console.log("Fetching PUUID of team ", teamName);
		for (const player of players) {
			const puuid = await getPuuid(player.summonerName, player.tagLine);
			player.puuid = puuid;
			console.log("Assigning PUUID: ", puuid, " to: ", player.summonerName);
			savePlayers();
			await sleep(500);
		}
	}

});

