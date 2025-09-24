# RPS Pro - A Stone, Paper, Scissors Game

This is a professional and engaging web-based implementation of the classic game "Stone, Paper, Scissors". It's built with modern web technologies and features a clean, responsive user interface, and online multiplayer.

## Features

* **Light & Dark Themes:** Easily switch between a light and dark theme for your visual comfort.
* **Personalized Experience:** Set your player name to appear on the scoreboard.
* **Multiple Game Types:**
    * **Player vs Computer:** Play against the computer.
    * **Player vs Player:** Play against a friend on the same computer.
    * **Online:** Play against another player online.
* **Multiple Game Modes:**
    * **Endless:** Play for as long as you like.
    * **Best of 3:** The first player to win 2 rounds wins the series.
    * **Best of 5:** The first player to win 3 rounds wins the series.
    * **Best of 7:** The first player to win 4 rounds wins the series.
* **Persistent State:** Your name and theme preference are saved in your browser's local storage.
* **Move History:** Keep track of the last few moves made in the game.
*   **Responsive Design:** The game is designed to work well on both desktop and mobile devices.

## How to Play

1.  Open the `index.html` file in your web browser.
2.  A help modal will appear on your first visit, explaining the game.
3.  Enter your name in the "Player Name" field.
4.  Select a game type and mode from the dropdown menus.
5.  Click on one of the cards (Stone, Paper, or Scissors) to make your choice.
6.  The winner of the round will be displayed.
7.  Click "Play Again" to start the next round.

## How to Run Locally

To run this project locally, you will need to have Node.js installed.

### For Player vs Computer or Player vs Player:

1.  Clone this repository or download the project files.
2.  Navigate to the project directory.
3.  Open the `index.html` file directly in your favorite web browser (e.g., Chrome, Firefox, Edge).

### For Online Play:

1.  Clone this repository or download the project files.
2.  Navigate to the project directory in your terminal.
3.  Run `npm install` to install the required dependencies.
4.  Run `npm start` to start the WebSocket server.
5.  Open the `index.html` file in your web browser.
6.  Select the "Online" game type.
7.  Create a room and share the Room ID with a friend, or join a friend's room using their Room ID.

## Technologies Used

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   Node.js
*   WebSocket

## License

This project is licensed under the MIT License.

---

&copy; 2025 Sinha Gaming tech. All rights reserved.

## Deployment (quick guide)

This project separates frontend (static files) and backend (WebSocket server). GitHub Pages can host the frontend. The backend must be hosted on a public server (Railway, Render, Fly, etc.).

1. Deploy backend to Railway (recommended):
    - Create a Railway account and create a new project.
    - Connect your GitHub repo and deploy. Railway will use `npm start` to run `server.js` and provide a public URL.
    - Copy the host (e.g. `https://my-rps.up.railway.app`) and form the WebSocket URL using `wss://my-rps.up.railway.app`.

2. Update the client with the backend URL:
    - Edit `script.js` and set `WS_CONFIG.productionUrl` to your `wss://...` host.
    - Commit the change.

3. Publish frontend to GitHub Pages:
    - Option A: Use the repository Settings -> Pages and publish from `main` (root) or `gh-pages` branch.
    - Option B: Use `gh-pages` npm package to publish the current directory:
      ```powershell
      npm install --save-dev gh-pages
      npx gh-pages -d .
      ```

4. Verify:
    - Open the GitHub Pages URL and the browser console to confirm the client connects to your `wss://` backend.

If you want, I can add a `deploy` script to `package.json` and a GitHub Actions workflow to automate publishing the frontend to `gh-pages` on every push to `main`. Paste the backend URL and tell me if you want automation and I'll add those files for you.