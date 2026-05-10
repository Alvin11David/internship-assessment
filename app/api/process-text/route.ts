import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, target_language } = body;

    if (!text || !target_language) {
      return NextResponse.json(
        { error: 'Missing required fields: text, target_language' },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual Sunbird AI pipeline
    // For now, returning a mock response
    const mockResult = {
      pipeline: {
        transcript: text,
        summary: `Summary of: ${text.substring(0, 50)}...`,
        translation: `Translation to ${target_language}: ${text}`,
        audio: null,
      },
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
}
