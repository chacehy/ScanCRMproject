import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Strip base64 metadata header if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    if (!genAI) {
      console.warn('GEMINI_API_KEY environment variable is not set. Returning mock OCR data.');
      // Return realistic mock data for easy prototyping
      return NextResponse.json({
        name: 'Alex Rivera',
        phone: '+1 (555) 234-5678',
        email: 'alex.rivera@innovatesolutions.com',
        company: 'Innovate Solutions Inc.',
        jobTitle: 'VP of Product Engineering',
        website: 'www.innovatesolutions.com',
        _isMock: true,
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Analyze this business card image. Extract the contact details and return them as a JSON object with the following fields:
- name (string)
- phone (string)
- email (string)
- company (string)
- jobTitle (string)
- website (string)

If any field is missing or cannot be read, output an empty string. Return ONLY the JSON object.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const responseText = result.response.text().trim();
    
    // Parse response
    let extractedData;
    try {
      extractedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON. Raw response:', responseText, parseError);
      // Fallback: strip potential markdown code block formatting
      const cleanText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '')
        .trim();
      extractedData = JSON.parse(cleanText);
    }

    return NextResponse.json({
      name: extractedData.name || '',
      phone: extractedData.phone || '',
      email: extractedData.email || '',
      company: extractedData.company || '',
      jobTitle: extractedData.jobTitle || '',
      website: extractedData.website || '',
      _isMock: false,
    });

  } catch (error) {
    const err = error as Error;
    console.error('OCR processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process business card image: ' + err.message },
      { status: 500 }
    );
  }
}
