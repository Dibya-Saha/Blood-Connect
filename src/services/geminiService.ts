/**
 * FIXED Gemini Service for Browser Environment
 * Uses direct fetch API instead of SDK to avoid bundling issues
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
export const getHealthAdvice = async (prompt: string, language: 'en' | 'bn'): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return language === 'bn' 
      ? 'দুঃখিত, API কী সেটআপ করা হয়নি। অনুগ্রহ করে .env ফাইলে VITE_GEMINI_API_KEY যোগ করুন।'
      : 'Sorry, API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.';
  }

  const systemInstruction = language === 'bn' 
    ? "আপনি একজন বন্ধুত্বপূর্ণ বাংলাদেশি স্বাস্থ্য সহকারী। আপনার কাজ হলো রক্তদান সংক্রান্ত ভুল ধারণা (Myths) ভেঙে দেওয়া এবং স্বাস্থ্য পরামর্শ দেওয়া। বিশেষ করে বাংলাদেশের প্রেক্ষাপটে রক্তদান কেন গুরুত্বপূর্ণ এবং সাধারণ মানুষ যেসব কারণে রক্ত দিতে ভয় পায় সেগুলো সহজভাবে বুঝিয়ে বলুন। উত্তর সবসময় বাংলা ভাষায় দিন। সংক্ষিপ্ত এবং পরিষ্কার উত্তর দিন।"
    : "You are a friendly Bangladeshi health assistant. Your job is to bust blood donation myths and provide health advice specifically for the context of Bangladesh. Address common fears like weakness, infection, or religious concerns. Keep responses helpful, concise, and under 150 words.";

  const fullPrompt = `${systemInstruction}\n\nUser Question: ${prompt}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      
      if (response.status === 400) {
        return language === 'bn'
          ? 'দুঃখিত, API কনফিগারেশনে সমস্যা আছে। অনুগ্রহ করে একটি বৈধ API কী ব্যবহার করুন।'
          : 'Sorry, there is an API configuration issue. Please use a valid API key.';
      }
      
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid response format from Gemini API');
    
  } catch (error) {
    console.error('Gemini Service Error:', error);
    
    return language === 'bn' 
      ? 'দুঃখিত, বর্তমানে AI সেবা অনুপলব্ধ। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
      : 'Sorry, AI service is currently unavailable. Please try again later.';
  }
};