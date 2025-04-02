import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GoogleGenAI } from "@google/genai";
import { log } from "console";

function getPrompt(style: string): string {
  const template = process.env.TRANSFORM_PROMPT_TEMPLATE!;
  return template.replace(/\{\{style\}\}/g, style);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const style = formData.get("style") as string;

    const prompt = getPrompt(style);

    log(prompt);

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const contents = [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type,
              data: base64Image,
            },
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    let transformedBuffer: Buffer | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        transformedBuffer = Buffer.from(part.inlineData.data, "base64");
        break;
      }
    }

    if (!transformedBuffer) {
      throw new Error("No transformed image received from Gemini.");
    }

    const s3Key = `transformed/${Date.now()}-transformed.png`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: s3Key,
        Body: transformedBuffer,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000",
      })
    );
    const transformedImageUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`;

    return NextResponse.json({ transformedImageUrl });
  } catch (error) {
    console.error("Error during image processing:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
