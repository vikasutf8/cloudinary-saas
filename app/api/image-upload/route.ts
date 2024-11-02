import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, 
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET
});

interface CloudinaryUploadRequest {
    public_id: string;
    [key :string]: any;
}


export async function POST(request: NextRequest) {
    const { userId } =  await auth();

    if(!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File |null;
        if(!file) {
            return NextResponse.json({ error: 'No file found' }, { status: 400 });
        }

        //upload anything anywhere --arrayBuffer |upload_stream
        const bytes =await file.arrayBuffer();
        const buffer =Buffer.from(bytes);

        const result =await new Promise<CloudinaryUploadRequest>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {folder : "next-cloudinary-saas-images-upload"},
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

        return NextResponse.json({publicId: result.public_id},{status: 200});
    } catch (error) {
        console.log(error ,"upload image false at api image-upload");
        return NextResponse.json({message: "Something went wrong in POST image-upload"},{status: 500});
    }


}