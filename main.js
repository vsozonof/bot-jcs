//Insert your ApiKey here
const apiKey = "RGAPI-f2a7352f-ffbe-49f2-850c-50522184babb";

const button = document.querySelector(".buttonxdd");
const inputDiv = document.querySelector("input");

// List of all of the players to be integrated
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

let singularSummData = {};
let summonerData = [];
let singularQueueDataSummoner = [];
let queueDataSummoner = [];

function fileHandling(div) {
	//Promise to handle file processing otherwise I can't return the content of the JSON
	return new Promise((resolve, reject) => {
		let file = div.files[0];

		if (!file) {
			reject(new Error("No file were inserted"));
			return;
		}

		let reader = new FileReader();

		reader.onload = function() {
			// So I think the use of this try catch is incase there is any parsing Error
			try {
				resolve(JSON.parse(reader.result));
			} catch (error) {
				throw error;
			}
		};

		// and this one is for when reading the JSON Itself
		reader.onerror = function() {
			throw reader.error;
		};

		reader.readAsText(file);
	});
}

async function fetchRiotAPI(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP Request Error status:${response.status}`);
		}
		const data = await response.json();

		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
}

//String constructor to send to the API in order to get the profile data of each player
function constructProfileDataString(sumData) {
	let arr = [];

	for (let i = 0; i < sumData.length; i++) {
		arr.push(
			`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${sumData[i]}?api_key=${apiKey}`,
		);
	}

	return arr;
}

//String constructor to send to the API in order to get the puuid of the players, needed in order to re-fetch for the profile data
function constructPUUIDString(object) {
	let arr = [];

	for (let i = 0; i < object.length; i++) {
		arr.push(
			`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${object[i].name}/${object[i].tag}?api_key=${apiKey}`,
		);
	}

	return arr;
}

async function getProfileDataforEachPlayer() {
	const summonerList = await fileHandling(inputDiv);

	let constructedString = constructPUUIDString(summonerList);

	//Sending API request for each player (puuid)
	for (let i = 0; i < summonerList.length; i++) {
		singularSummData = await fetchRiotAPI(constructedString[i]);
		summonerData.push(singularSummData.puuid);
		await timer(200);
	}

	console.log(summonerData);

	constructedString = constructProfileDataString(summonerData);

	//Sending API request for each player (profile data)
	for (let i = 0; i < constructedString.length; i++) {
		singularQueueDataSummoner = await fetchRiotAPI(constructedString[i]);
		queueDataSummoner.push(singularQueueDataSummoner[0]);
		await timer(200);
	}
	console.log(queueDataSummoner);

	return queueDataSummoner;
}

button.addEventListener("click", async function() {
	//Prob add loading animations or smth

	try {
		const data = await getProfileDataforEachPlayer();

		console.log(data);
	} catch (error) {
		// add Error handling for the user, a popup or a message
		console.log(error);
		return null;
	}
});
