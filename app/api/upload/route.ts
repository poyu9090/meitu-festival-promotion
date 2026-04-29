import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  const formData = await req.formData()
  const activityId = parseInt(formData.get('activityId') as string)
  const files = formData.getAll('files') as File[]

  const saved: { id: number; filename: string; path: string }[] = []

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
    await writeFile(filePath, buffer)

    const image = await prisma.activityImage.create({
      data: { activityId, filename, path: `/uploads/${filename}` },
    })
    saved.push(image)
  }

  return NextResponse.json(saved, { status: 201 })
}
