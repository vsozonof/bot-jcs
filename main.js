//Insert your ApiKey here
const apiKey = "";

const button = document.querySelector(".buttonxdd");
const buttonQueueData = document.querySelector(".button-queue");


// List of all of the players to be integrated
const summonerList = [{name: "siweth", tag:"owo"}, {name:"zboubax", tag:"euw"}, {name:"Shunsui Kyôraku", tag:"SLF"}];

const timer = ms => new Promise(res => setTimeout(res, ms));

let singularSummData = {};
let summonerData = [];
let singularQueueDataSummoner = [];
let queueDataSummoner = [];


async function fetchRiotAPI(url) {

    try {
            const response = await fetch(url)
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
function constructStringQueueData(sumData) {

    let arr = [];

    for (let i = 0; i < sumData.length; i++) {
        arr.push(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${sumData[i]}?api_key=${apiKey}`);
    }

    return arr;

}

//String constructor to send to the API in order to get the puuid of the players, needed in order to re-fetch for the profile data
function constructSumonnerDataString(object) {
    let arr = [];

    for (let i = 0; i < object.length; i++) {
        arr.push(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${object[i].name}/${object[i].tag}?api_key=${apiKey}`)
    }

    return arr;
}


button.addEventListener("click", async function() {
    let constructedString = constructSumonnerDataString(summonerList);

    //Sending API request for each player (puuid)
    for (let i = 0; i < summonerList.length; i++) {
        singularSummData = await fetchRiotAPI(constructedString[i]);
        summonerData.push(singularSummData.puuid);
        await timer(200);
    }

    console.log(summonerData);

})

buttonQueueData.addEventListener("click", async function() {
    constructedString = constructStringQueueData(summonerData)

    //Sending API request for each player (profile data)
    for (let i = 0; i < summonerList.length; i++) {
        singularQueueDataSummoner = await fetchRiotAPI(constructedString[i]);
        queueDataSummoner.push(singularQueueDataSummoner[0]);
        await timer(200);
    }
    console.log(queueDataSummoner);
})


