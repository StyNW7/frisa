import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { clearStore } from '@/lib/storage'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * The prototype is presented live, so a render error must not leave a white screen
 * on a projector. It fails to a readable screen with two ways out: retry the render,
 * or reset to the known-good seed state that every demo starts from.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept so the cause is recoverable from the console after a demo.
    console.error('FRISA crashed while rendering:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="app-frame">
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-ember-50 text-ember-600">
            <TriangleAlert className="h-7 w-7" strokeWidth={1.9} aria-hidden />
          </span>
          <h1 className="mt-6 text-[22px] font-extrabold leading-tight tracking-tight text-ink">
            Something went wrong
          </h1>
          <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-ink-muted">
            FRISA hit an unexpected error and stopped this screen to avoid showing you wrong information.
          </p>

          <p className="mt-4 max-w-full truncate rounded-2xl bg-mist px-3 py-2 font-mono text-2xs text-ink-muted">
            {error.message}
          </p>

          <div className="mt-8 w-full space-y-3">
            <Button size="lg" block onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button
              variant="outline"
              size="lg"
              block
              onClick={() => {
                clearStore()
                window.location.assign('/')
              }}
            >
              <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
              Restart the demo
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
