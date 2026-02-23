import FeedbackWidget from '@/components/FeedbackWidget'

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FeedbackWidget source="Team Portal" />
    </>
  )
}
