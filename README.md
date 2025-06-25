# Reddit AI Bot

This project automates posting and replying on Reddit using AI-generated content.

It uses:
- **Snoowrap** for Reddit API
- **Github Playground**
- Manual approval before posting or replying (safe to operate)

---

## Features

- Scrapes top posts from specific subreddits.
- Uses AI (Meta Llama 3.1 70B via Azure) to generate new posts based on existing popular posts.
- Prompts for human approval before posting.
- Automatically replies to recent posts in a subreddit with short AI-generated comments.
- Completely avoids spam behavior; all posts and replies require manual confirmation.

---

## Requirements

- Node.js >= 18
- Reddit API credentials
- Azure Inference endpoint with Meta Llama 3.1 model deployed
- GitHub Token (used here as an API key for Azure Inference)

---

## Setup

- Clone repository
    git clone https://github.com/iamValen/reddit-bot.git
    cd reddit-ai-bot

- Instal dependencies
    npm install

- Insert a .env file with this credentials:
    REDDIT_CLIENT_ID=your_client_id
    REDDIT_CLIENT_SECRET=your_client_secret
    REDDIT_USERNAME=your_reddit_username
    REDDIT_PASSWORD=your_reddit_password

- Make sure you are logged in with git 
    git config --global user.name "Your Name"
    git config --global user.email "you@example.com"
    
    or
    
    export TOKEN=ghp_yourGitHubTokenHere

---

## To add

- Automatic post/comment toggle option 