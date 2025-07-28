import { redirect } from 'next/navigation'

export default function ProjectRootPage() {
  // Redirect to home if no project is selected (will trigger project selection)
  redirect('/')
}