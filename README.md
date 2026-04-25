# Echo News

Echo News is a news aggregator I built using React and Firebase. It pulls in articles from a few different APIs and uses AI to help you get through the news faster. I wanted to make something that looks clean and actually feels useful for keeping up with what's happening.

## Core Features

*   News from everywhere: It connects to The Guardian, NewsAPI, and NewsData so you get a lot of different perspectives.
*   AI stuff: I used Google Gemini to add features like article summaries and an interactive Q&A for each story.
*   Personalized: You can save articles you like to your favorites and check back on your reading history whenever you want.
*   Write your own: There is a built in editor if you want to create and post your own news articles to the platform.
*   Design: It has a modern look with glassmorphism and smooth animations, and it works great on phones too.

## Getting Started

### Prerequisites
You just need Node.js installed on your machine and a Firebase project set up for the backend stuff. You will also need to grab some API keys for the news sources and the AI.

### Setup Steps
1.  Clone this repository to your computer.
2.  Run `npm install` to get all the dependencies ready.
3.  Copy `.env.example` to a new file called `.env`.
4.  Fill in your API keys in the `.env` file.
5.  Run `npm start` to get the development server running.

## Configuration Details

You will need to set up a few external accounts to get all the features working.

### Firebase Setup
Create a new project in the Firebase console and add a web app. Copy the config values into your `.env` file. You should also enable Email/Password and Google sign in under the Authentication tab. For the database, just start a Firestore instance in test mode.

### API Keys
*   Google Gemini: Head over to Google AI Studio to get your key for the AI features.
*   The Guardian: Register on their developer site for an access key.
*   NewsAPI: Sign up on their website to get a free developer key.

## Project Organization

I tried to keep the code organized so it is easy to navigate:
*   `src/components`: This folder has all the smaller UI pieces like buttons and cards.
*   `src/pages`: These are the main views of the app, like the Home and Profile pages.
*   `src/services`: All the logic for fetching news and talking to Firebase is in here.
*   `src/config`: Basic setup for things like environment variables.

## Tech Stack
The app is built with React for the frontend and Firebase for the backend. I used Google Gemini for the AI logic and a mix of CSS and modern UI libraries for the styling.

## Contributing
If you want to help out or have ideas for new features, feel free to open a pull request. I am always looking for ways to make the app better.

## License
This project is licensed under the MIT License.
