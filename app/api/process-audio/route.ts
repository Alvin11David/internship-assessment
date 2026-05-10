import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const targetLanguage = formData.get('target_language') as string;

    if (!audioFile || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, target_language' },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual Sunbird AI pipeline
    // For now, returning a mock response
    const mockResult = {
      pipeline: {
        transcript: 'Transcribed audio text...',
        summary: 'Summary of audio content...',
        translation: `Translation to ${targetLanguage}...`,
        audio: null,
      },
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
