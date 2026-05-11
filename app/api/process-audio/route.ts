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

    // Forward to Python backend
    const backendFormData = new FormData();
    backendFormData.append('audio', audioFile);
    backendFormData.append('target_language', targetLanguage);

    const response = await fetch('http://localhost:5000/api/process-audio', {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to process audio' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
