import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const username = formData.get("username");
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const profession = formData.get("profession");
    const company = formData.get("company") || null;
    const addressLine1 = formData.get("addressLine1");
    const country = formData.get("country");
    const state = formData.get("state");
    const city = formData.get("city");
    const subscription = formData.get("subscription");
    const newsletter = formData.get("newsletter") === "on";

    const file = formData.get("profilePhoto");

    let photoPath = null;

    if (file && typeof file.name === "string") {
      const uniqueName = `${uuidv4()}-${file.name}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadDir = path.join(process.cwd(), "public", "uploads");

      // Ensure uploads directory exists
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);
      photoPath = `/uploads/${uniqueName}`;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        profession,
        company,
        addressLine1,
        country,
        state,
        city,
        subscription,
        newsletter,
        profilePhoto: photoPath,
      },
    });

    return Response.json({ success: true, user });
  } catch (error) {
    console.error("Error submitting profile:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
