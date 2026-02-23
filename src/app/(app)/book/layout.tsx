import FeedbackWidget from '@/components/FeedbackWidget'

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FeedbackWidget source="Client Portal" />
    </>
  )
}
