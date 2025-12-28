
import { GoogleGenAI, Type } from "@google/genai";
import { Board } from "../types";

export async function getGeminiHint(board: Board) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert board to simple string representation
  const boardStr = board.map(row => 
    row.map(cell => cell.value === null ? '.' : cell.value).join(' ')
  ).join('\n');

  const prompt = `
    I am playing a 6x6 Sudoku. The blocks are 2 rows by 3 columns.
    Numbers 1-6 are used.
    Here is the current board state ('.' is empty):
    
    ${boardStr}
    
    Provide a specific hint for the next move. 
    Explain which cell (row, column, 0-indexed) to fill, what value it should be, and the logic why.
    Keep the explanation brief but helpful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble thinking right now. Try checking for lone candidates!";
  }
}

export async function parseSudokuImage(base64Image: string, mimeType: string): Promise<(number | null)[][] | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a Sudoku digit recognition expert. 
    Analyze this image of a 6x6 Sudoku board. 
    Extract the numbers visible on the board. 
    The grid is exactly 6x6. 
    The blocks are 2 rows high and 3 columns wide.
    Return the board as a JSON object with a 'grid' property, which is a 6x6 array of numbers. 
    Use null for empty cells. 
    Only return the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          { 
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.INTEGER,
                  nullable: true
                }
              }
            }
          },
          required: ["grid"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    if (result.grid && Array.isArray(result.grid) && result.grid.length === 6) {
      return result.grid;
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Parsing Error:", error);
    return null;
  }
}
