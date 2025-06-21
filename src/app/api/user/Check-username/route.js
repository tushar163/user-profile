import prisma from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  const user = await prisma.user.findUnique({
    where: { username }
  });

  return Response.json({ available: !user });
}