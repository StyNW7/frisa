import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { PlainAppShell } from '@/components/common/MobileAppShell'
import { Button } from '@/components/common/Button'
import { FrisaMark } from '@/components/common/FrisaMark'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <PlainAppShell>
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <FrisaMark className="h-16 w-16" />
        <h1 className="mt-6 text-[26px] font-extrabold leading-tight tracking-tight text-ink">
          This shelf is empty
        </h1>
        <p className="mt-3 max-w-[280px] text-[15px] leading-relaxed text-ink-muted">
          The page you were looking for is not part of FRISA. Everything else is still where you left it.
        </p>
        <div className="mt-8 w-full space-y-3">
          <Button size="lg" block onClick={() => navigate('/home')}>
            <Compass className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
            Go to Home
          </Button>
          <Button variant="outline" size="lg" block onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    </PlainAppShell>
  )
}
