import OpenAI from "openai";

const openai = new OpenAI(
    process.env.OPENAI_API_KEY
);

export default async function summarizeText(text) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
                role: "user",
                content: "Rephrase the following text in plain text, no headers or lists. Try to keep as many details as possible from the input and do not lose comprehension or flow. Make sure your rephrasing is signficantly shorter than the input: " + text,
            },
        ],
        store: true,
    });


    console.log(completion.choices[0].message);
    return completion.choices[0].message.content;
}