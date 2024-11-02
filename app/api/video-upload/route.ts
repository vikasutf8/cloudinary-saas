import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';


//prisma
const prisma =new PrismaClient();

 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, 
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET
});

interface CloudinaryUploadRequest {
    public_id: string;
    bytes: number;
    duration?: number;
    [key :string]: any;
}


export async function POST(request: NextRequest) {
    

    try {

        const { userId } =  await auth();

        if(!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    
        if( !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || !process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET) {
            return NextResponse.json({error: 'Cloudinary not configured'}, {status: 500});
        }
        

        const formData = await request.formData();
        const file = formData.get('file') as File |null;
        const title = formData.get('title') as string ;
        const description = formData.get('description') as string;
        const originalSize = formData.get('originalSize') as string;
        
        if(!file) {
            return NextResponse.json({ error: 'No file found' }, { status: 400 });
        }

        //upload anything anywhere --arrayBuffer |upload_stream
        const bytes =await file.arrayBuffer();
        const buffer =Buffer.from(bytes);

        const result =await new Promise<CloudinaryUploadRequest>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder : "next-cloudinary-saas-videos-upload",
                        transformation: [
                            {quality: "auto", fetch_format: "mp4"},
                        ]
                    },
                    (error, result) => {
                        if(error) {
                            reject(error);
                        } else {
                            resolve(result as CloudinaryUploadRequest);
                        }
                    }
                )
                uploadStream.end(buffer);
            }
        )

        //save to prisma
        const video = await prisma.video.create({
            data: {
                
                publicId: result.public_id,
                title: title,
                description: description,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0
            }
        });

        return NextResponse.json(video)
    } catch (error) {
        console.log(error ,"upload video false at api video-upload");
        return NextResponse.json({message: "Something went wrong in POST video-upload"},{status: 500});
    }
    finally{
        await prisma.$disconnect();
    }


}