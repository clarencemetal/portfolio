// Importe le package pour utiliser les variables d'environnement
require('dotenv').config();
// Importe le package pour faire des appels API
const fetch = require('node-fetch');

// Le contexte de votre profil, pour guider l'IA
const cvContext = `Clarence Borne est un étudiant en deuxième année de bachelor en ingénierie mécanique à l'HEIA-FR. Il a une formation initiale de dessinateur en construction microtechnique, validée par un CFC et une maturité professionnelle technique. Son expérience inclut la conception 3D (CATIA V5, NX), un stage en usinage CNC, et un service comme Lieutenant dans l'armée suisse où il a dirigé 30 soldats et obtenu un certificat de conduite de l'ASC. Ses compétences incluent l'ingénierie mécanique, la CAO, le leadership et il parle français, allemand (B2) et anglais (B2).`;

exports.handler = async function(event, context) {
    // 1. Récupérer la question envoyée depuis le formulaire
    const { question } = JSON.parse(event.body);

    // 2. Construire le prompt pour Gemini
    const prompt = `Tu es un assistant pour le portfolio de Clarence Borne. En te basant strictement sur le contexte suivant, réponds à la question de l'utilisateur de manière concise et professionnelle. Ne mentionne pas que tu es une IA. Contexte: ${cvContext}. Question: "${question}". Réponds en français.`;

    // 3. Récupérer la clé API secrète depuis les variables d'environnement Netlify
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "La clé API n'est pas configurée sur le serveur." })
        };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // 4. Appeler l'API Gemini
    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Erreur de l\'API Gemini:', errorText);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ error: "L'API de l'assistant a retourné une erreur." })
            };
        }

        const data = await geminiResponse.json();
        const reply = data.candidates[0]?.content?.parts[0]?.text || "Désolé, je n'ai pas pu formuler de réponse.";

        // 5. Renvoyer la réponse de l'IA à la page web
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: reply })
        };

    } catch (error) {
        console.error('Erreur interne de la fonction:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Une erreur est survenue lors du traitement de votre question." })
        };
    }
};
