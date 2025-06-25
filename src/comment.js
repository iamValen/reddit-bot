require('dotenv').config();
const snoowrap = require('snoowrap');
const { OpenAI } = require('openai');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Reddit client
const reddit = new snoowrap({
  userAgent: 'bot/1.0',
  clientId: 'P3WAF7KwoAeXD1woZH2E4Q',
  clientSecret: 'MKFyLS9vOe8j1BL3ReRDcjWlq7Gg0A',
  username: 'Longjumping-Cry-6540',
  password: 'breakingBad21rddt'
});

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Meta-Llama-3.1-70B-Instruct";

const client = new OpenAI({
  baseURL: endpoint,
  apiKey: token
});

const SUBREDDIT = "stories";
const repliedPosts = new Set();

async function getAIResponse(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: "You're a witty and smart Reddit user. Reply shortly like a human, stay on topic, don't take it too seriously. Avoid emojis, onomatopoeias, or 'Oh'." },
        { role: "user", content: prompt }
      ],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 80
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("Error generating AI response:", err);
    return null;
  }
}

function validateReply(post, aiResponse) {
  return new Promise(resolve => {
    console.log("\nPost Title:", post.title);
    console.log("\nDate:", new Date(post.created_utc * 1000).toLocaleString());
    console.log("\nPost Body:", post.selftext || "(No body)");
    console.log("\nAI:", aiResponse);

    rl.question("\nApprove response? (y/n): ", answer => {
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function processAndReply() {
  try {
    const subreddit = await reddit.getSubreddit(SUBREDDIT);
    const posts = await subreddit.getNew({ limit: 10 });

    for (const post of posts) {
      if (!repliedPosts.has(post.id)) {
        const aiResponse = await getAIResponse(post.title + " " + post.selftext);

        if (aiResponse) {
          const approved = await validateReply(post, aiResponse);
          if (approved) {
            await post.reply(aiResponse);
            repliedPosts.add(post.id);
            console.log("Replied successfully.");
          } else {
            console.log("Skipped response.");
          }
          console.log("=================================================");
        }
      }
    }

    rl.question("\nCheck more posts? (y/n): ", answer => {
      if (answer.toLowerCase() === "y") {
        processAndReply();
      } else {
        console.log("Done.");
        rl.close();
      }
    });

  } catch (err) {
    console.error("Error processing posts: ", err);
  }
}

processAndReply();
