require('dotenv').config();
const snoowrap = require('snoowrap');
const { OpenAI } = require('openai');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Reddit client setup
const reddit = new snoowrap({
  userAgent: 'bot/1.0',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
});

// OpenAI client setup (Azure)
const client = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN
});

const modelName = "Meta-Llama-3.1-70B-Instruct";
const subreddits = ["sideproject"];
const delay = ms => new Promise(res => setTimeout(res, ms));

async function getFlair(subredditObj) {
  try {
    const flairs = await subredditObj.getLinkFlairTemplates();
    return flairs.length ? { flair_id: flairs[0].flair_template_id, flair_text: flairs[0].flair_text } : null;
  } catch (err) {
    console.error(`Error getting flairs for ${subredditObj.display_name}:`, err);
    return null;
  }
}

async function generatePost(subreddit, postsText) {
  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: `You're a funny and intellectual user posting on "${subreddit}". Write a coherent and popular post. Don't copy directly, no quotes, no emojis.` },
        { role: "user", content: postsText }
      ],
      temperature: 1.0,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("Invalid AI response");

    const titleMatch = content.match(/Title:\s*(.+)/i);
    const bodyMatch = content.match(/Body:\s*([\s\S]+)/i);
    if (!titleMatch || !bodyMatch) throw new Error("Bad AI formatting");

    return { title: titleMatch[1].trim(), body: bodyMatch[1].trim() };
  } catch (err) {
    console.error("Error generating AI post:", err);
    return null;
  }
}

async function validatePost(subreddit, aiPost) {
  return new Promise(resolve => {
    rl.question(`\n> Subreddit: ${subreddit}\n> Title: ${aiPost.title}\n> Body: ${aiPost.body}\n\nPost? (y/n): `, answer => {
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function processSubreddit(subreddit) {
  try {
    console.log(`\nProcessing subreddit: ${subreddit}`);
    const subredditObj = reddit.getSubreddit(subreddit);
    const posts = await subredditObj.getTop({ time: 'all', limit: 100 });
    if (!posts.length) {
      console.error(`No posts found in ${subreddit}`);
      return false;
    }

    const postsText = posts.map((post, i) => `${i + 1}. "${post.title}" - Upvotes: ${post.ups}`).join("\n");
    console.log("Collected posts. Generating AI post...");

    const aiPost = await generatePost(subreddit, postsText);
    if (!aiPost?.title || !aiPost?.body) return false;

    const flair = await getFlair(subredditObj);
    if (flair) console.log(`Selected flair: ${flair.flair_text}`);

    const approved = await validatePost(subreddit, aiPost);
    if (!approved) {
      console.log(`Post rejected. Skipping ${subreddit}.`);
      return false;
    }

    console.log(`Posting to ${subreddit}: "${aiPost.title}"`);
    await subredditObj.submitSelfpost({
      title: aiPost.title,
      text: aiPost.body,
      flair_id: flair?.flair_id
    });

    console.log(`> Posted successfully to ${subreddit}.`);
    return true;
  } catch (err) {
    console.error(`Error processing ${subreddit}:`, err);
    return false;
  }
}

async function processSubreddits(subredditList) {
  for (const subreddit of subredditList) {
    const posted = await processSubreddit(subreddit);
    if (posted) {
      console.log("Waiting before next subreddit...\n");
      await delay(600000); // 10 min
    }
  }
  console.log("All subreddits processed. Done.");
  rl.close();
}

processSubreddits(subreddits);
