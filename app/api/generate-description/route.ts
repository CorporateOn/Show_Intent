import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(request: Request) {
    const { itemName, category } = await request.json();

    if (!itemName || !category) {
        return NextResponse.json({ error: "Item name and category are required." }, { status: 400 });
    }

    try {
      const prompt = `Create a short, delicious, and appealing menu description for a dish.
      - Dish Name: "${itemName}"
      - Category: "${category}"
      - Tone: Enthusiastic and appetizing.
      - Length: 1-2 sentences.
      - Example: For "Grilled Salmon", a good description is "A perfectly grilled salmon fillet, seasoned with herbs and served with fresh, crisp asparagus. A healthy and delightful choice."

      Now, generate the description for ${itemName}.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const description = response.text();

      return NextResponse.json({ description: description.trim() });
    } catch (error) {
      console.error("Error generating description with Gemini:", error);
      return NextResponse.json({ error: "Failed to generate description. Please try again." }, { status: 500 });
    }
}