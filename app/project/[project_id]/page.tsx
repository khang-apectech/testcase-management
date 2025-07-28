import { redirect } from 'next/navigation'

interface ProjectPageProps {
  params: { project_id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { project_id } = await params
  
  // Redirect to project dashboard
  redirect(`/project/${project_id}/dashboard`)
}