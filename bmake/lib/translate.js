const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_KEY });

export async function translateText(text, targetLanguage) {
    const [translation] = await translate.translate(text, targetLanguage);
    console.log(`Translated text: ${translation}`);
    return translation;
}

// Example usage
// translateText("Dear Professor Gray, do you love my work?", "fr").then(console.log);


// use this to find language ids: https://cloud.google.com/translate/docs/languages