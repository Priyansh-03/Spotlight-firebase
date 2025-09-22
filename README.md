# Spotlight

Welcome to Spotlight. This application is your personal AI assistant for creating powerful and effective ad campaigns for Meta platforms like Facebook and Instagram.

## What is Spotlight?

Spotlight helps you turn an Instagram profile into a complete advertising strategy. You give it an Instagram account and tell it your goals, and our smart AI analyzes everything to generate ad copy, headlines, target audiences, and even budget suggestions. It is designed to save you time and help you create better ads, faster.

## How It Works

Using Spotlight is a simple, step by step process.

1.  **Tell Us About Your Campaign**
    You start by providing an Instagram profile URL and filling out a simple form about your campaign goals. You can specify what you want to achieve, like getting more website traffic, generating leads, or making sales.

2.  **AI Analyzes Your Profile**
    Our AI gets to work. It looks at the Instagram profile's biography, recent posts, and brand voice to understand the business, its niche, and its style.

3.  **Get Your Ad Proposal**
    The AI presents you with a full proposal. This includes a summary of your brand, suggested keywords for targeting, and a list of potential audiences found directly on Meta's network.

4.  **Generate Ad Variations**
    Once you are happy with the analysis, you can generate a full set of ad variations. The AI creates multiple versions of ad copy, headlines, and creative ideas, all tailored to your campaign goal. It also recommends the best audiences to target.

5.  **Review and Save**
    You can review everything, edit the ad copy, select your final audiences, and save your complete ad set.

## Key Features

*   **AI Powered Profile Analysis**: Spotlight deeply understands a brand's voice and content just from its Instagram profile.

*   **Automatic Ad Generation**: It creates multiple unique ad variations, including headlines and text, in just one click.

*   **Smart Audience Targeting**: It finds real audiences on Meta based on your keywords and then uses AI to recommend the best ones for your specific goal.

*   **Budget Estimator**: Get smart, AI driven suggestions for your campaign budget based on your audience size and goals.

*   **Easy Editing and Saving**: You have full control to refine the AI's suggestions and save your completed ad campaigns for future use.

## Technologies We Use

Spotlight is built with modern and powerful technologies to give you a smooth experience.

*   **Frontend**: Next.js, React, and TypeScript
*   **Styling**: Tailwind CSS and shadcn/ui components
*   **Artificial Intelligence**: Google's Gemini AI
*   **Audience Data**: Meta (Facebook) Graph API

## Getting Started

To run this project on your own machine, you will need to set up a few things.

First, you need to create a file named `.env` in the main folder of the project. This file will hold your secret API keys. Here is what it should look like:

```
GEMINI_API_KEY="Your_Google_AI_Studio_API_Key"
META_API_KEY="Your_Facebook_App_Access_Token"
META_AD_ACCOUNT_ID="act_Your_Ad_Account_ID"
```

Next, open your terminal, navigate to the project folder, and run the following commands.

1.  **Install all the necessary packages:**
    ```
    npm install
    ```

2.  **Run the development server:**
    ```
    npm run dev
    ```

Once the server is running, you can open your web browser and go to `http://localhost:9002` to see the application in action.
