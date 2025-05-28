### SOLOQ Challenge

Link to get your API key: https://developer.riotgames.com/  
Link to the operations: https://developer.riotgames.com/apis

The dev API key need to be refreshed every 24H.  
In the case we want a permanent API key, we would need to ask Riot on their form to register our personal project  
Link: https://developer.riotgames.com/app-type  

---

TODO (no order): 
- Integrate the ability to send a JSON or a TXT of all your players. Done (but not necessary if we go with the process below)  
- Calculate the differences of players elo between the previous day and the current day.  
Since all the players are permanent we could just hardcode the PUUID directly?  
**What could be done:**  
    - Day 1 = Check if the user came on this page already or not via localStorage  
If not fetch the currentElo of each players, store it in localStorage then show it and a message "Comeback Tommorow!"  
If the user already came today then take it from localStorage and show it.  
We can a add a timestamp in localStorage alongside players Elo and make a basic check.  

    - Day 2 = The user comeback same check if he came already today via a timeStamp in LocalStorage since he didn't ->  
Fetch the currentElo of each players for D2  
Make the difference with the D1 data stored in localStorage  
Show the difference to the user then overwrite the elo of Day 1 by the elo of Day 2  

- Style the HTML a bit more  

Later features?:  
- Showing an average of the elo of each team at the current day and overall.  
- Showing the lowest and highest elo among teams and overall.  
- Maybe integrate all these into a Discord bot?  

