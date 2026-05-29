/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is missing. Please configure it in your Settings > Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config: any;
  }
) {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 2; // Try up to 2 times for each model
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`[AI] Attempting generateContent with model: ${model} (attempt ${attempt}/${attempts})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errMessage = error.message || '';
        console.error(`[AI] Error with model ${model} (attempt ${attempt}/${attempts}):`, error);

        // Check if the error is temporary / capacity related
        const isTemporary = 
          errMessage.includes('503') ||
          errMessage.includes('UNAVAILABLE') ||
          errMessage.includes('high demand') ||
          errMessage.includes('Overloaded') ||
          errMessage.includes('429') ||
          errMessage.includes('Resource has been exhausted') ||
          error.status === 503 ||
          error.status === 429;

        if (!isTemporary) {
          // If it's a structural config/parameter/auth error, throw immediately
          if (errMessage.includes('API_KEY') || errMessage.includes('key')) {
            throw error;
          }
        }

        if (attempt < attempts && isTemporary) {
          const delay = attempt * 1000;
          console.log(`[AI] Temporary error. Waiting ${delay}ms before retrying ${model}...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.warn(`[AI] Model ${model} failed all attempts or is overloaded. Trying next fallback model...`);
  }

  throw lastError || new Error('All models failed to generate content');
}

async function startServer() {
  const app = express();

  // Increase payload limits for handling base64 uploaded images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route: Analyze food image
  app.post('/api/analyze-food', async (req, res) => {
    try {
      const { imageBase64, mimeType, lang = 'ua' } = req.body;

      if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: 'Image base64 data and mimeType are required' });
        return;
      }

      // Safeguard API Key and lazy initialize
      const ai = getAIClient();

      const imagePart = {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      };

      const isEnglish = lang === 'en';

      const systemInstruction = isEnglish
        ? "You are an experienced, certified nutritionist and food analysis expert. " +
          "Your task is to analyze the food image and provide the most realistic " +
          "estimation of its portion weight (in grams), volume (in milliliters for liquids or soups, otherwise 0), " +
          "proteins, fats, carbohydrates, total calories, and ingredients. " +
          "Take into account visual cues: plate size, utensils, shadows, and food texture " +
          "to estimate portion size as accurately as possible. The response, descriptions, and all text MUST be provided EXCLUSIVELY in English."
        : "Ти є досвідченим сертифікованим нутриціологом та експертом з аналізу їжі. " +
          "Твоє завдання — проаналізувати зображення їжі й дати максимально реалістичну " +
          "оцінку її ваги порції (в грамах), об'єму (в мілілітрах, якщо це рідина або суп, інакше 0), " +
          "білків, жирів, вуглеводів, загальної калорійності та інгредієнтів. " +
          "Візьми до уваги візуальні орієнтири: розмір тарілки, приборів, тіні та текстуру " +
          "їжі, щоб оцінити розмір порції максимально точно. Відповідь та опис надавай ВИКЛЮЧНО українською мовою.";

      const promptText = isEnglish
        ? "Please analyze the meal in this photo in detail. " +
          "Identify its name, estimate the total portion weight, volume (if liquid), calculate proteins, fats, carbohydrates in grams, and total kcal. " +
          "Provide a complete list of ingredients with their weights and a detailed nutritional explanation of your assessment in English."
        : "Будь ласка, детально проаналізуй страву на цьому фото. " +
          "Визнач її назву, оціни загальну вагу порції, об'єм (якщо рідка), підрахуй білки, жири, вуглеводи у грамах та загальну ккал. " +
          "Надай повний список інгредієнтів з їхньою вагою й детальне нутриціологічне пояснення оцінки українською мовою.";

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: isEnglish
              ? "Name of the dish or food item in English."
              : "Назва страви або продукту харчування українською мовою."
          },
          weightGrams: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Approximate portion weight in grams (positive float or integer)."
              : "Приблизна вага порції страви у грамах (ціле або дробове додатне число)."
          },
          volumeMl: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Approximate portion volume in milliliters (for soups, beverages, smoothies, etc.; return 0 if the dish is solid)."
              : "Приблизний об'єм порції у мілілітрах (для супів, напоїв, смузі тощо; якщо страва тверда, поверни 0)."
          },
          proteins: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Protein content in grams for the entire portion."
              : "Вміст білків у грамах на всю цю порцію."
          },
          fats: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Fat content in grams for the entire portion."
              : "Вміст жирів у грамах на всю цю порцію."
          },
          carbohydrates: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Carbohydrate content in grams for the entire portion."
              : "Вміст вуглеводів у грамах на всю цю порцію."
          },
          kcal: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Total kilocalories (kcal) for the entire portion."
              : "Загальна кількість кілокалорій (ккал) на всю цю порцію."
          },
          ingredients: {
            type: Type.ARRAY,
            description: isEnglish
              ? "List of identified ingredients of this portion with their approximate weight in grams."
              : "Список ідентифікованих інгредієнтів цієї порції страви з їхнім орієнтовним внеском у грамах.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: isEnglish
                    ? "Ingredient name in English (e.g., chicken fillet, tomato, olive oil)."
                    : "Назва інгредієнта українською мовою (наприклад: куряче філе, помідор, оливкова олія)."
                },
                weight: {
                  type: Type.NUMBER,
                  description: isEnglish
                    ? "Weight of this ingredient in grams inside the portion."
                    : "Маса цього інгредієнта в грамах у складі страви."
                }
              },
              required: ["name", "weight"]
            }
          },
          explanation: {
            type: Type.STRING,
            description: isEnglish
              ? "Short professional justification of the assessment in English: why this portion size, weight, composition and which food details support it."
              : "Коротке та професійне обґрунтування оцінки українською мовою: чому саме такий об'єм/вага і склад, які характерні особливості страви видно."
          }
        },
        required: ["name", "weightGrams", "volumeMl", "proteins", "fats", "carbohydrates", "kcal", "ingredients", "explanation"]
      };

      const response = await generateContentWithFallback(ai, {
        contents: [imagePart, { text: promptText }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error('Error in /api/analyze-food:', error);
      const message = error.message || 'Unknown server error';
      res.status(500).json({ 
        error: message.includes('GEMINI_API_KEY') 
          ? 'Помилка авторизації: GEMINI_API_KEY не налаштований у Secrets. Налаштуйте його в меню Settings.'
          : `Не вдалося проаналізувати страву: ${message}` 
      });
    }
  });

  // API Route: Analyze food text description
  app.post('/api/analyze-food-text', async (req, res) => {
    try {
      const { query, lang = 'ua' } = req.body;

      if (!query || !query.trim()) {
        res.status(400).json({ error: 'Text query is required' });
        return;
      }

      // Safeguard API Key and lazy initialize
      const ai = getAIClient();

      const isEnglish = lang === 'en';

      const systemInstruction = isEnglish
        ? "You are an experienced, certified nutritionist and food analysis expert. " +
          "Your task is to analyze the text query describing a meal or food items and estimate its portion weight (in grams), volume (in milliliters for liquids/soups, otherwise 0), " +
          "proteins, fats, carbohydrates, total calories, and ingredients. " +
          "If weights or specific ingredient proportions are not mentioned, approximate them using realistic/typical standard portion shapes and sizes. " +
          "The response, descriptions, and all text MUST be provided EXCLUSIVELY in English."
        : "Ти є досвідченим сертифікованим нутриціологом та експертом з аналізу їжі. " +
          "Твоє завдання — проаналізувати опис страви чи продуктів у тексті й дати максимально реалістичну " +
          "оцінку її ваги порції (в грамах), об'єму (в мілілітрах для супів і напоїв, інакше 0), " +
          "білків, жирів, вуглеводів, загальної калорійності та інгредієнтів. " +
          "Якщо користувач не вказав точну вагу, припусти типові середні ваги для здорової порції. " +
          "Відповідь та опис надавай ВИКЛЮЧНО українською мовою.";

      const promptText = isEnglish
        ? `Please retrieve nutrition values for: "${query}". Estimate its total weight, volume, macros (protein, fat, carbohydrates in grams) and kcal. Produce the ingredients and a professional feedback.`
        : `Будь ласка, визнач нутрієнти для: "${query}". Оціни загальну вагу, об'єм, показники БЖВ, ккал, детальні інгредієнти та надай професійне пояснення.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: isEnglish
              ? "Name of the dish or food item in English (e.g., Grilled Chicken with Rice)."
              : "Назва страви або продукту харчування українською мовою (наприклад: Курка гриль з рисом)."
          },
          weightGrams: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Approximate portion weight in grams."
              : "Приблизна вага порції страви у грамах."
          },
          volumeMl: {
            type: Type.NUMBER,
            description: isEnglish
              ? "Approximate portion volume in milliliters (for liquids, soups, beverages; else 0)."
              : "Приблизний об'єм порції у мілілітрах (для супів, напоїв, смузі тощо; якщо тверда страва, поверни 0)."
          },
          proteins: {
            type: Type.NUMBER,
            description: "Protein content in grams for the portion."
          },
          fats: {
            type: Type.NUMBER,
            description: "Fat content in grams for the portion."
          },
          carbohydrates: {
            type: Type.NUMBER,
            description: "Carbohydrate content in grams for the portion."
          },
          kcal: {
            type: Type.NUMBER,
            description: "Total kilocalories (kcal) for the entire portion."
          },
          ingredients: {
            type: Type.ARRAY,
            description: "List of identified ingredients with their weight in grams.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: isEnglish ? "Ingredient name in English" : "Назва інгредієнта українською"
                },
                weight: {
                  type: Type.NUMBER,
                  description: "Weight of this ingredient in grams."
                }
              },
              required: ["name", "weight"]
            }
          },
          explanation: {
            type: Type.STRING,
            description: isEnglish
              ? "Short justification of nutrition value assessment in English."
              : "Коротке та професійне пояснення джерела калорій та користі страви українською мовою."
          }
        },
        required: ["name", "weightGrams", "volumeMl", "proteins", "fats", "carbohydrates", "kcal", "ingredients", "explanation"]
      };

      const response = await generateContentWithFallback(ai, {
        contents: [{ text: promptText }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error('Error in /api/analyze-food-text:', error);
      const message = error.message || 'Unknown server error';
      res.status(500).json({ 
        error: message.includes('GEMINI_API_KEY') 
          ? 'Помилка авторизації: GEMINI_API_KEY не налаштований у Secrets. Налаштуйте його в меню Settings.'
          : `Не вдалося проаналізувати текст: ${message}` 
      });
    }
  });

  // Error handler to prevent returning HTML on parsing/limit errors (like PayloadTooLargeError)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      console.error('Express Request Middleware Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Request processing error occurred'
      });
      return;
    }
    next();
  });

  // Integration of Vite middleware for dev mode, static files for prod mode
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV !== 'production' || !hasDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
